/**
 * Compressed NFT (cNFT) Service
 *
 * Handles compressed NFT operations including minting, transfers,
 * merkle proof retrieval, and tree capacity management.
 *
 * cNFTs use Metaplex Bubblegum and Solana's State Compression programs.
 * They cost ~$0.0005 to mint (vs ~$2 for regular NFTs), making them
 * ideal for large collections (10K+).
 *
 * Key differences from regular NFTs:
 *   - Stored in merkle trees, not individual accounts
 *   - Transfers require merkle proofs
 *   - Identified by asset ID (derived from tree + leaf index), not mint address
 *   - Tree capacity must be provisioned upfront
 */

import { db } from '@stacksjs/database'
import { cache } from './CacheService'

// ============================================
// Types
// ============================================

export interface MerkleTreeConfig {
  maxDepth: number
  maxBufferSize: number
  canopyDepth: number
}

export interface MerkleTreeInfo {
  address: string
  collectionId: string
  maxDepth: number
  maxBufferSize: number
  canopyDepth: number
  capacity: number
  usedLeaves: number
  remainingCapacity: number
  usagePercent: number
  createdAt: number
}

export interface CNFTMintResult {
  assetId: string
  leafIndex: number
  treeAddress: string
  signature: string
}

export interface CNFTProof {
  root: string
  proof: string[]
  leafIndex: number
  treeId: string
  canopyDepth: number
}

export interface CNFTTransferParams {
  mintAddress: string
  treeAddress: string
  leafIndex: number
  fromWallet: string
  toWallet: string
}

export interface CompressedNFTStats {
  totalTrees: number
  totalCNFTs: number
  totalCapacity: number
  totalUsed: number
  treesNearCapacity: number
}

// ============================================
// Constants
// ============================================

const TREE_CAPACITY_ALERT_THRESHOLD = 0.80 // Alert at 80% capacity
const TREE_STATS_CACHE_KEY = 'cnft_tree_stats'
const TREE_STATS_CACHE_TTL = 60 // 1 minute

// Default tree configurations by collection size
const TREE_PRESETS: Record<string, MerkleTreeConfig> = {
  small: { maxDepth: 14, maxBufferSize: 64, canopyDepth: 11 },    // 16,384 NFTs
  medium: { maxDepth: 17, maxBufferSize: 64, canopyDepth: 14 },   // 131,072 NFTs
  large: { maxDepth: 20, maxBufferSize: 256, canopyDepth: 17 },   // 1,048,576 NFTs
}

// ============================================
// CompressedNFTService
// ============================================

class CompressedNFTService {
  private rpcUrl: string

  constructor() {
    this.rpcUrl = (typeof Bun !== 'undefined' ? Bun.env : process.env).RPC_URL
      || 'https://api.devnet.solana.com'
  }

  /**
   * Check if an NFT is compressed based on DB record.
   */
  async isCompressed(mintAddress: string): Promise<boolean> {
    try {
      const nft = await db
        .selectFrom('nfts')
        .select('is_compressed')
        .where('mint_address', '=', mintAddress)
        .executeTakeFirst()

      return nft?.is_compressed === 1 || nft?.is_compressed === true
    }
    catch {
      return false
    }
  }

  /**
   * Get compression data for a cNFT.
   */
  async getCompressionData(mintAddress: string): Promise<{
    treeAddress: string | null
    leafIndex: number | null
    isCompressed: boolean
  }> {
    try {
      const nft = await db
        .selectFrom('nfts')
        .select(['is_compressed', 'tree_address', 'leaf_index'])
        .where('mint_address', '=', mintAddress)
        .executeTakeFirst()

      if (!nft) {
        return { treeAddress: null, leafIndex: null, isCompressed: false }
      }

      return {
        treeAddress: nft.tree_address || null,
        leafIndex: nft.leaf_index ?? null,
        isCompressed: nft.is_compressed === 1 || nft.is_compressed === true,
      }
    }
    catch {
      return { treeAddress: null, leafIndex: null, isCompressed: false }
    }
  }

  /**
   * Get merkle proof for a cNFT transfer.
   * The proof is needed to verify the leaf's position in the tree.
   */
  async getMerkleProof(mintAddress: string): Promise<CNFTProof | null> {
    const data = await this.getCompressionData(mintAddress)
    if (!data.isCompressed || !data.treeAddress || data.leafIndex === null) {
      return null
    }

    try {
      // Use DAS API (getAssetProof) if available, otherwise reconstruct from tree
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAssetProof',
          params: { id: mintAddress },
        }),
        signal: AbortSignal.timeout(10_000),
      })

      const result = await response.json() as { result?: { root: string, proof: string[], tree_id: string } }

      if (!result.result) {
        return null
      }

      return {
        root: result.result.root,
        proof: result.result.proof,
        leafIndex: data.leafIndex,
        treeId: result.result.tree_id || data.treeAddress,
        canopyDepth: 0, // Will be determined by tree config
      }
    }
    catch {
      return null
    }
  }

  /**
   * Register a new merkle tree in the database.
   */
  async registerTree(
    address: string,
    collectionId: string,
    config: MerkleTreeConfig,
  ): Promise<void> {
    const capacity = 2 ** config.maxDepth

    try {
      await db
        .insertInto('merkle_trees')
        .values({
          address,
          collection_id: collectionId,
          max_depth: config.maxDepth,
          max_buffer_size: config.maxBufferSize,
          canopy_depth: config.canopyDepth,
          capacity,
          used_leaves: 0,
          created_at: new Date().toISOString(),
        })
        .execute()

      cache.delete(TREE_STATS_CACHE_KEY)
    }
    catch {
      // Tree may already be registered
    }
  }

  /**
   * Increment the used leaf count for a tree after minting.
   */
  async incrementTreeUsage(treeAddress: string, count: number = 1): Promise<void> {
    try {
      await db
        .updateTable('merkle_trees')
        .set((eb: any) => ({
          used_leaves: eb('used_leaves', '+', count),
        }))
        .where('address', '=', treeAddress)
        .execute()

      cache.delete(TREE_STATS_CACHE_KEY)
    }
    catch {
      // Non-fatal
    }
  }

  /**
   * Get info about a specific merkle tree.
   */
  async getTreeInfo(treeAddress: string): Promise<MerkleTreeInfo | null> {
    try {
      const tree = await db
        .selectFrom('merkle_trees')
        .selectAll()
        .where('address', '=', treeAddress)
        .executeTakeFirst()

      if (!tree) return null

      return this.formatTreeInfo(tree)
    }
    catch {
      return null
    }
  }

  /**
   * Get all trees for a collection.
   */
  async getCollectionTrees(collectionId: string): Promise<MerkleTreeInfo[]> {
    try {
      const trees = await db
        .selectFrom('merkle_trees')
        .selectAll()
        .where('collection_id', '=', collectionId)
        .execute()

      return trees.map(tree => this.formatTreeInfo(tree))
    }
    catch {
      return []
    }
  }

  /**
   * Find a tree with available capacity for minting.
   * Returns the tree with the most remaining capacity.
   */
  async findAvailableTree(collectionId: string): Promise<MerkleTreeInfo | null> {
    try {
      const trees = await db
        .selectFrom('merkle_trees')
        .selectAll()
        .where('collection_id', '=', collectionId)
        .execute()

      const available = trees
        .map(tree => this.formatTreeInfo(tree))
        .filter(tree => tree.remainingCapacity > 0)
        .sort((a, b) => b.remainingCapacity - a.remainingCapacity)

      return available[0] || null
    }
    catch {
      return null
    }
  }

  /**
   * Check which trees are nearing capacity.
   */
  async getTreesNearCapacity(collectionId?: string): Promise<MerkleTreeInfo[]> {
    try {
      let query = db.selectFrom('merkle_trees').selectAll()

      if (collectionId) {
        query = query.where('collection_id', '=', collectionId) as any
      }

      const trees = await query.execute()

      return trees
        .map(tree => this.formatTreeInfo(tree))
        .filter(tree => tree.usagePercent >= TREE_CAPACITY_ALERT_THRESHOLD * 100)
    }
    catch {
      return []
    }
  }

  /**
   * Get overall cNFT statistics.
   */
  async getStats(): Promise<CompressedNFTStats> {
    const cached = cache.get<CompressedNFTStats>(TREE_STATS_CACHE_KEY)
    if (cached) return cached

    try {
      const trees = await db.selectFrom('merkle_trees').selectAll().execute()

      let totalCapacity = 0
      let totalUsed = 0
      let treesNearCapacity = 0

      for (const tree of trees) {
        totalCapacity += Number(tree.capacity)
        totalUsed += Number(tree.used_leaves)
        const usage = Number(tree.used_leaves) / Number(tree.capacity)
        if (usage >= TREE_CAPACITY_ALERT_THRESHOLD) {
          treesNearCapacity++
        }
      }

      // Count total cNFTs in the system
      let totalCNFTs = 0
      try {
        const result = await db
          .selectFrom('nfts')
          .select(db.fn.count('id').as('count'))
          .where('is_compressed', '=', 1)
          .executeTakeFirst()
        totalCNFTs = Number(result?.count || 0)
      }
      catch {
        totalCNFTs = totalUsed // Fallback to tree usage count
      }

      const stats: CompressedNFTStats = {
        totalTrees: trees.length,
        totalCNFTs,
        totalCapacity,
        totalUsed,
        treesNearCapacity,
      }

      cache.set(TREE_STATS_CACHE_KEY, stats, TREE_STATS_CACHE_TTL)
      return stats
    }
    catch {
      return {
        totalTrees: 0,
        totalCNFTs: 0,
        totalCapacity: 0,
        totalUsed: 0,
        treesNearCapacity: 0,
      }
    }
  }

  /**
   * Get a tree configuration preset by name.
   */
  getPreset(name: string): MerkleTreeConfig | undefined {
    return TREE_PRESETS[name]
  }

  /**
   * Get all available presets.
   */
  getPresets(): Record<string, MerkleTreeConfig & { capacity: number }> {
    const result: Record<string, MerkleTreeConfig & { capacity: number }> = {}
    for (const [name, config] of Object.entries(TREE_PRESETS)) {
      result[name] = { ...config, capacity: 2 ** config.maxDepth }
    }
    return result
  }

  /**
   * Calculate the capacity of a tree from its max depth.
   */
  calculateCapacity(maxDepth: number): number {
    return 2 ** maxDepth
  }

  /**
   * Estimate the SOL cost for creating a merkle tree.
   * Cost is primarily rent for the tree account.
   */
  estimateTreeCost(config: MerkleTreeConfig): number {
    // Approximate formula based on Solana rent costs
    // Tree account size depends on maxDepth and maxBufferSize
    const nodeSize = 32 // bytes per node hash
    const headerSize = 64 // approximate header bytes
    const canopySize = (2 ** (config.canopyDepth + 1) - 2) * nodeSize
    const bufferSize = config.maxBufferSize * (config.maxDepth * nodeSize + headerSize)
    const totalBytes = canopySize + bufferSize + headerSize

    // Solana rent: ~0.00000696 SOL per byte per epoch (approximate)
    const rentPerByte = 0.00000696
    return Math.ceil(totalBytes * rentPerByte * 100) / 100
  }

  /**
   * Format raw tree DB record into MerkleTreeInfo.
   */
  private formatTreeInfo(tree: any): MerkleTreeInfo {
    const capacity = Number(tree.capacity)
    const usedLeaves = Number(tree.used_leaves)
    return {
      address: tree.address,
      collectionId: tree.collection_id,
      maxDepth: Number(tree.max_depth),
      maxBufferSize: Number(tree.max_buffer_size),
      canopyDepth: Number(tree.canopy_depth),
      capacity,
      usedLeaves,
      remainingCapacity: capacity - usedLeaves,
      usagePercent: capacity > 0 ? Math.round((usedLeaves / capacity) * 100) : 0,
      createdAt: new Date(tree.created_at).getTime(),
    }
  }
}

// Singleton
export const compressedNFTService = new CompressedNFTService()
export default CompressedNFTService
