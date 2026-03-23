/**
 * Self-hosted NFT Indexer Service
 *
 * Since we control minting, we already know every NFT in our ecosystem.
 * This service maintains an indexed view of all NFTs, their traits,
 * ownership, and marketplace events — no external API dependencies.
 *
 * Data flow:
 *   Mint → indexOnMint() → DB (nfts + nft_traits)
 *   External transfer → syncCollectionOwnership() → DB update
 *   Metadata → fetchAndCacheMetadata() → DB + cache
 */

import { cache } from './CacheService'
import { rpcService } from './RPCService'

// Use environment-aware variable access
const env = typeof Bun !== 'undefined' ? Bun.env : process.env

// ============================================
// Types
// ============================================

export interface MintIndexData {
  mint: string
  name: string
  symbol: string
  uri: string
  owner: string
  collectionId: number
  attributes?: TraitAttribute[]
  image?: string
  compressed?: boolean
  treeAddress?: string
  leafIndex?: number
}

export interface TraitAttribute {
  trait_type: string
  value: string
}

export interface NFTMetadata {
  name: string
  symbol?: string
  description?: string
  image: string
  animation_url?: string
  external_url?: string
  attributes?: TraitAttribute[]
  properties?: {
    files?: Array<{ uri: string, type: string }>
    category?: string
    creators?: Array<{ address: string, share: number }>
  }
}

export interface SearchFilters {
  collectionId?: number
  status?: 'listed' | 'unlisted' | 'all'
  minPrice?: number
  maxPrice?: number
  traits?: Record<string, string[]>
  sort?: 'price_asc' | 'price_desc' | 'recent' | 'name' | 'rarity'
  cursor?: number
  limit?: number
}

export interface CollectionStats {
  totalSupply: number
  listedCount: number
  floorPrice: number | null
  uniqueOwners: number
  totalVolume: number
  totalSales: number
}

export interface TraitCount {
  traitType: string
  traitValue: string
  count: number
}

export interface OwnershipChange {
  nftId: number
  mintAddress: string
  previousOwner: string
  newOwner: string
}

// ============================================
// IndexerService
// ============================================

class IndexerService {
  private readonly METADATA_FETCH_TIMEOUT = 10_000
  private readonly OWNERSHIP_BATCH_SIZE = 100

  /**
   * Index an NFT at mint time.
   * Called from MintNftAction after a successful mint.
   * Since we mint it, we have all the data — no external API needed.
   */
  async indexOnMint(db: any, data: MintIndexData): Promise<void> {
    const metadata = data.uri
      ? await this.fetchAndCacheMetadata(data.mint, data.uri)
      : null

    const attributes = data.attributes || metadata?.attributes || []
    const image = data.image || metadata?.image || ''

    await db
      .insertInto('nfts')
      .values({
        mint_address: data.mint,
        name: data.name,
        token_id: data.mint,
        image_url: image,
        owner_wallet_address: data.owner,
        collection_id: data.collectionId,
        attributes: JSON.stringify(attributes),
        metadata_url: data.uri,
        is_compressed: data.compressed ? 1 : 0,
        tree_address: data.treeAddress || null,
        leaf_index: data.leafIndex ?? null,
        status: 'unlisted',
        is_for_sale: 0,
        indexed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .onConflict((oc: any) => oc.column('mint_address').doUpdateSet({
        owner_wallet_address: data.owner,
        updated_at: new Date().toISOString(),
      }))
      .execute()

    if (attributes.length > 0) {
      await this.indexTraits(db, data.mint, data.collectionId, attributes)
    }
  }

  /**
   * Sync ownership for all NFTs in a collection.
   * Catches transfers that happened outside our platform.
   * Returns the list of ownership changes detected.
   */
  async syncCollectionOwnership(db: any): Promise<OwnershipChange[]> {
    const changes: OwnershipChange[] = []

    // Get all active collections
    let collections: any[]
    try {
      collections = await db
        .selectFrom('collections')
        .selectAll()
        .execute()
    }
    catch {
      return changes
    }

    for (const collection of collections) {
      const collectionChanges = await this.syncSingleCollectionOwnership(
        db,
        collection.id,
      )
      changes.push(...collectionChanges)
    }

    return changes
  }

  /**
   * Sync ownership for a single collection's NFTs.
   */
  async syncSingleCollectionOwnership(
    db: any,
    collectionId: number,
  ): Promise<OwnershipChange[]> {
    const changes: OwnershipChange[] = []

    let nfts: any[]
    try {
      nfts = await db
        .selectFrom('nfts')
        .where('collection_id', '=', collectionId)
        .where('is_compressed', '=', 0)
        .select(['id', 'mint_address', 'owner_wallet_address'])
        .execute()
    }
    catch {
      return changes
    }

    const chunks = this.chunk(nfts, this.OWNERSHIP_BATCH_SIZE)

    for (const chunk of chunks) {
      const batchChanges = await this.syncOwnershipBatch(db, chunk, collectionId)
      changes.push(...batchChanges)
    }

    return changes
  }

  /**
   * Sync ownership for a batch of NFTs using batched RPC calls.
   */
  private async syncOwnershipBatch(
    db: any,
    nfts: any[],
    collectionId: number,
  ): Promise<OwnershipChange[]> {
    const changes: OwnershipChange[] = []

    for (const nft of nfts) {
      try {
        const currentOwner = await this.getTokenOwner(nft.mint_address)

        if (currentOwner && currentOwner !== nft.owner_wallet_address) {
          await db
            .updateTable('nfts')
            .set({
              owner_wallet_address: currentOwner,
              status: 'unlisted',
              listing_price: null,
              is_for_sale: 0,
              updated_at: new Date().toISOString(),
            })
            .where('id', '=', nft.id)
            .execute()

          await this.recordEvent(db, {
            type: 'transfer',
            nftId: nft.id,
            nftMint: nft.mint_address,
            collectionId,
            fromWallet: nft.owner_wallet_address,
            toWallet: currentOwner,
            source: 'external',
          })

          changes.push({
            nftId: nft.id,
            mintAddress: nft.mint_address,
            previousOwner: nft.owner_wallet_address,
            newOwner: currentOwner,
          })
        }
      }
      catch (err) {
        console.error(`[Indexer] Failed to sync ownership for ${nft.mint_address}:`, err)
      }
    }

    return changes
  }

  /**
   * Get the current owner of an NFT via RPC.
   * Finds the token account with amount=1 and returns its owner.
   */
  async getTokenOwner(mintAddress: string): Promise<string | null> {
    try {
      const result = await rpcService.call('getTokenLargestAccounts', [mintAddress])

      if (!result?.value || !Array.isArray(result.value)) return null

      const ownerAccount = result.value.find(
        (a: any) => a.amount === '1',
      )

      if (!ownerAccount) return null

      const accountInfo = await rpcService.call('getAccountInfo', [
        ownerAccount.address,
        { encoding: 'jsonParsed' },
      ])

      return accountInfo?.value?.data?.parsed?.info?.owner || null
    }
    catch {
      return null
    }
  }

  /**
   * Fetch metadata JSON from Arweave/IPFS and cache it.
   * Metadata is immutable after mint, so we cache indefinitely.
   */
  async fetchAndCacheMetadata(
    mintAddress: string,
    uri: string,
  ): Promise<NFTMetadata | null> {
    if (!uri) return null

    const cacheKey = `metadata:${mintAddress}`
    const cached = cache.get<NFTMetadata>(cacheKey)
    if (cached) return cached

    try {
      const controller = new AbortController()
      const timeout = setTimeout(
        () => controller.abort(),
        this.METADATA_FETCH_TIMEOUT,
      )

      const response = await fetch(uri, { signal: controller.signal })
      clearTimeout(timeout)

      if (!response.ok) return null

      const metadata: NFTMetadata = await response.json()

      // Cache indefinitely (metadata doesn't change)
      cache.set(cacheKey, metadata, Number.MAX_SAFE_INTEGER)

      return metadata
    }
    catch (err) {
      console.error(`[Indexer] Failed to fetch metadata for ${mintAddress}:`, err)
      return null
    }
  }

  /**
   * Index individual trait values for fast filtering.
   */
  async indexTraits(
    db: any,
    mintAddress: string,
    collectionId: number,
    attributes: TraitAttribute[],
  ): Promise<void> {
    for (const attr of attributes) {
      if (!attr.trait_type || attr.value === undefined) continue

      try {
        // Try insert, update on conflict
        await db
          .insertInto('nft_traits')
          .values({
            mint_address: mintAddress,
            collection_id: collectionId,
            trait_type: attr.trait_type,
            trait_value: String(attr.value),
            created_at: new Date().toISOString(),
          })
          .onConflict((oc: any) =>
            oc.columns(['mint_address', 'trait_type']).doUpdateSet({
              trait_value: String(attr.value),
            }),
          )
          .execute()
      }
      catch {
        // Table may not exist yet — skip silently
      }
    }

    // Invalidate cached trait counts for this collection
    cache.invalidate(`trait_counts:${collectionId}`)
  }

  /**
   * Get aggregated trait counts for a collection.
   * Powers the filter sidebar: "Background: Purple (342), Blue (1,205)"
   */
  async getTraitCounts(db: any, collectionId: number): Promise<TraitCount[]> {
    return cache.getOrFetch(
      `trait_counts:${collectionId}`,
      CacheService.TTL.ATTRIBUTES,
      async () => {
        try {
          const rows = await db
            .selectFrom('nft_traits')
            .where('collection_id', '=', collectionId)
            .groupBy(['trait_type', 'trait_value'])
            .select([
              'trait_type',
              'trait_value',
              db.fn.count('id').as('count'),
            ])
            .orderBy('trait_type', 'asc')
            .orderBy('count', 'desc')
            .execute()

          return rows.map((r: any) => ({
            traitType: r.trait_type,
            traitValue: r.trait_value,
            count: Number(r.count),
          }))
        }
        catch {
          return []
        }
      },
    )
  }

  /**
   * Get collection-level stats from our indexed data.
   */
  async getCollectionStats(db: any, collectionId: number): Promise<CollectionStats> {
    return cache.getOrFetch(
      `collection_stats:${collectionId}`,
      CacheService.TTL.COLLECTION_STATS,
      async () => {
        const [nftStats, volumeStats] = await Promise.all([
          this.queryNftStats(db, collectionId),
          this.queryVolumeStats(db, collectionId),
        ])

        return {
          totalSupply: Number(nftStats?.totalSupply || 0),
          listedCount: Number(nftStats?.listedCount || 0),
          floorPrice: nftStats?.floorPrice ? Number(nftStats.floorPrice) : null,
          uniqueOwners: Number(nftStats?.uniqueOwners || 0),
          totalVolume: Number(volumeStats?.totalVolume || 0),
          totalSales: Number(volumeStats?.totalSales || 0),
        }
      },
    )
  }

  private async queryNftStats(db: any, collectionId: number) {
    try {
      const allNfts = await db
        .selectFrom('nfts')
        .where('collection_id', '=', collectionId)
        .select(['status', 'listing_price', 'owner_wallet_address'])
        .execute()

      const totalSupply = allNfts.length
      const listedNfts = allNfts.filter((n: any) =>
        n.status === 'listed' || n.listing_price,
      )
      const listedCount = listedNfts.length
      const floorPrice = listedNfts.length > 0
        ? Math.min(...listedNfts.map((n: any) => Number(n.listing_price || 0)).filter((p: number) => p > 0))
        : null
      const uniqueOwners = new Set(
        allNfts.map((n: any) => n.owner_wallet_address).filter(Boolean),
      ).size

      return { totalSupply, listedCount, floorPrice, uniqueOwners }
    }
    catch {
      return { totalSupply: 0, listedCount: 0, floorPrice: null, uniqueOwners: 0 }
    }
  }

  private async queryVolumeStats(db: any, collectionId: number) {
    try {
      const sales = await db
        .selectFrom('marketplace_events')
        .where('collection_id', '=', collectionId)
        .where('type', '=', 'sale')
        .select(['price'])
        .execute()

      const totalVolume = sales.reduce(
        (sum: number, s: any) => sum + Number(s.price || 0),
        0,
      )

      return { totalVolume, totalSales: sales.length }
    }
    catch {
      return { totalVolume: 0, totalSales: 0 }
    }
  }

  /**
   * Search NFTs across collections with filtering, sorting, and pagination.
   */
  async searchNFTs(db: any, query: string, filters: SearchFilters = {}): Promise<any[]> {
    try {
      let allNfts = await this.fetchNftsForSearch(db, filters)

      // Full-text search on name
      if (query) {
        const lowerQuery = query.toLowerCase()
        allNfts = allNfts.filter((n: any) =>
          (n.name || '').toLowerCase().includes(lowerQuery)
          || (n.mint_address || '').toLowerCase().includes(lowerQuery)
          || (n.token_id || '').toString().includes(lowerQuery),
        )
      }

      // Apply trait filters
      if (filters.traits && Object.keys(filters.traits).length > 0) {
        allNfts = await this.filterByTraits(db, allNfts, filters.traits)
      }

      // Sort
      allNfts = this.sortNfts(allNfts, filters.sort || 'recent')

      // Cursor pagination
      if (filters.cursor) {
        const cursorIdx = allNfts.findIndex((n: any) => n.id === filters.cursor)
        if (cursorIdx >= 0) {
          allNfts = allNfts.slice(cursorIdx + 1)
        }
      }

      const limit = Math.min(100, Math.max(1, filters.limit || 50))
      return allNfts.slice(0, limit)
    }
    catch {
      return []
    }
  }

  private async fetchNftsForSearch(db: any, filters: SearchFilters): Promise<any[]> {
    let q = db.selectFrom('nfts').selectAll()

    if (filters.collectionId) {
      q = q.where('collection_id', '=', filters.collectionId)
    }

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'listed') {
        q = q.where((eb: any) =>
          eb.or([
            eb('status', '=', 'listed'),
            eb('is_for_sale', '=', 1),
          ]),
        )
      }
      else if (filters.status === 'unlisted') {
        q = q.where('status', '=', 'unlisted')
          .where('is_for_sale', '=', 0)
      }
    }

    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      q = q.where('listing_price', '>=', filters.minPrice)
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      q = q.where('listing_price', '<=', filters.maxPrice)
    }

    return q.execute()
  }

  /**
   * Filter NFTs by traits using the nft_traits table.
   * Uses AND logic across trait types, OR logic within a trait type.
   */
  private async filterByTraits(
    db: any,
    nfts: any[],
    traits: Record<string, string[]>,
  ): Promise<any[]> {
    if (!nfts.length) return nfts

    const mintAddresses = nfts.map((n: any) => n.mint_address).filter(Boolean)
    if (!mintAddresses.length) return nfts

    // For each trait type, find mints that have any of the specified values
    let validMints = new Set(mintAddresses)

    for (const [traitType, traitValues] of Object.entries(traits)) {
      if (!traitValues.length) continue

      try {
        const matchingTraits = await db
          .selectFrom('nft_traits')
          .where('trait_type', '=', traitType)
          .where('trait_value', 'in', traitValues)
          .where('mint_address', 'in', Array.from(validMints))
          .select('mint_address')
          .execute()

        const matchingMints = new Set(
          matchingTraits.map((t: any) => t.mint_address),
        )

        // AND across trait types
        validMints = new Set(
          Array.from(validMints).filter(m => matchingMints.has(m)),
        )
      }
      catch {
        // nft_traits table may not exist
        return nfts
      }
    }

    return nfts.filter((n: any) => validMints.has(n.mint_address))
  }

  /**
   * Sort NFTs by the specified criteria.
   */
  private sortNfts(nfts: any[], sort: string): any[] {
    const sorted = [...nfts]

    switch (sort) {
      case 'price_asc':
        sorted.sort((a, b) => this.getNftPrice(a) - this.getNftPrice(b))
        break
      case 'price_desc':
        sorted.sort((a, b) => this.getNftPrice(b) - this.getNftPrice(a))
        break
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'rarity': {
        const order: Record<string, number> = {
          legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4,
        }
        sorted.sort((a, b) =>
          (order[(a.rarity || 'common').toLowerCase()] ?? 5)
          - (order[(b.rarity || 'common').toLowerCase()] ?? 5),
        )
        break
      }
      case 'recent':
      default:
        sorted.sort((a, b) =>
          new Date(b.created_at || 0).getTime()
          - new Date(a.created_at || 0).getTime(),
        )
        break
    }

    return sorted
  }

  private getNftPrice(nft: any): number {
    if (nft.listing_price) return Number(nft.listing_price)
    return Number(nft.price || 0)
  }

  /**
   * Record a marketplace event (sale, listing, transfer, etc.)
   */
  async recordEvent(
    db: any,
    event: {
      type: string
      nftId?: number
      nftMint?: string
      collectionId?: number
      fromWallet?: string
      toWallet?: string
      price?: number
      source?: string
      txSignature?: string
    },
  ): Promise<void> {
    try {
      await db
        .insertInto('marketplace_events')
        .values({
          type: event.type,
          nft_id: event.nftId || null,
          nft_mint: event.nftMint || null,
          collection_id: event.collectionId || null,
          from_wallet: event.fromWallet || null,
          to_wallet: event.toWallet || null,
          price: event.price || null,
          source: event.source || 'hoodies',
          tx_signature: event.txSignature || null,
          created_at: new Date().toISOString(),
        })
        .execute()

      // Invalidate collection stats cache
      if (event.collectionId) {
        cache.invalidate(`collection_stats:${event.collectionId}`)
      }
    }
    catch (err) {
      console.error('[Indexer] Failed to record event:', err)
    }
  }

  /**
   * Get recent marketplace events with filtering.
   */
  async getEvents(
    db: any,
    options: {
      type?: string
      collectionId?: number
      wallet?: string
      limit?: number
      cursor?: number
    } = {},
  ): Promise<any[]> {
    try {
      let q = db.selectFrom('marketplace_events').selectAll()

      if (options.type) {
        q = q.where('type', '=', options.type)
      }

      if (options.collectionId) {
        q = q.where('collection_id', '=', options.collectionId)
      }

      if (options.wallet) {
        q = q.where((eb: any) =>
          eb.or([
            eb('from_wallet', '=', options.wallet),
            eb('to_wallet', '=', options.wallet),
          ]),
        )
      }

      if (options.cursor) {
        q = q.where('id', '<', options.cursor)
      }

      q = q.orderBy('id', 'desc')
        .limit(Math.min(100, options.limit || 50))

      return q.execute()
    }
    catch {
      return []
    }
  }

  /**
   * Split an array into chunks of a given size.
   */
  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }
}

// Import CacheService class for TTL constants
import CacheService from './CacheService'

// Singleton
export const indexerService = new IndexerService()
export default IndexerService
