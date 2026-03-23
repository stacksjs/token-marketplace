import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify CompressedNFTService structure
// ============================================

const servicePath = 'app/Services/CompressedNFTService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('CompressedNFTService file structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('defines CompressedNFTService class', () => {
    expect(serviceSource).toContain('class CompressedNFTService')
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const compressedNFTService = new CompressedNFTService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default CompressedNFTService')
  })
})

describe('CompressedNFTService types', () => {
  test('defines MerkleTreeConfig interface', () => {
    expect(serviceSource).toContain('export interface MerkleTreeConfig')
  })

  test('MerkleTreeConfig has maxDepth, maxBufferSize, canopyDepth', () => {
    expect(serviceSource).toContain('maxDepth: number')
    expect(serviceSource).toContain('maxBufferSize: number')
    expect(serviceSource).toContain('canopyDepth: number')
  })

  test('defines MerkleTreeInfo interface', () => {
    expect(serviceSource).toContain('export interface MerkleTreeInfo')
  })

  test('defines CNFTMintResult interface', () => {
    expect(serviceSource).toContain('export interface CNFTMintResult')
  })

  test('defines CNFTProof interface', () => {
    expect(serviceSource).toContain('export interface CNFTProof')
  })

  test('CNFTProof has root, proof, leafIndex, treeId', () => {
    expect(serviceSource).toContain('root: string')
    expect(serviceSource).toContain('proof: string[]')
    expect(serviceSource).toContain('leafIndex: number')
    expect(serviceSource).toContain('treeId: string')
  })

  test('defines CNFTTransferParams interface', () => {
    expect(serviceSource).toContain('export interface CNFTTransferParams')
  })

  test('defines CompressedNFTStats interface', () => {
    expect(serviceSource).toContain('export interface CompressedNFTStats')
  })
})

describe('CompressedNFTService methods', () => {
  test('has isCompressed method', () => {
    expect(serviceSource).toContain('async isCompressed(mintAddress: string): Promise<boolean>')
  })

  test('has getCompressionData method', () => {
    expect(serviceSource).toContain('async getCompressionData(mintAddress: string)')
  })

  test('has getMerkleProof method', () => {
    expect(serviceSource).toContain('async getMerkleProof(mintAddress: string): Promise<CNFTProof | null>')
  })

  test('has registerTree method', () => {
    expect(serviceSource).toContain('async registerTree(')
  })

  test('has incrementTreeUsage method', () => {
    expect(serviceSource).toContain('async incrementTreeUsage(treeAddress: string')
  })

  test('has getTreeInfo method', () => {
    expect(serviceSource).toContain('async getTreeInfo(treeAddress: string): Promise<MerkleTreeInfo | null>')
  })

  test('has getCollectionTrees method', () => {
    expect(serviceSource).toContain('async getCollectionTrees(collectionId: string): Promise<MerkleTreeInfo[]>')
  })

  test('has findAvailableTree method', () => {
    expect(serviceSource).toContain('async findAvailableTree(collectionId: string): Promise<MerkleTreeInfo | null>')
  })

  test('has getTreesNearCapacity method', () => {
    expect(serviceSource).toContain('async getTreesNearCapacity(')
  })

  test('has getStats method', () => {
    expect(serviceSource).toContain('async getStats(): Promise<CompressedNFTStats>')
  })

  test('has getPreset method', () => {
    expect(serviceSource).toContain('getPreset(name: string)')
  })

  test('has getPresets method', () => {
    expect(serviceSource).toContain('getPresets()')
  })

  test('has calculateCapacity method', () => {
    expect(serviceSource).toContain('calculateCapacity(maxDepth: number): number')
  })

  test('has estimateTreeCost method', () => {
    expect(serviceSource).toContain('estimateTreeCost(config: MerkleTreeConfig): number')
  })
})

describe('CompressedNFTService tree presets', () => {
  test('has small preset (depth 14)', () => {
    expect(serviceSource).toContain('small:')
    expect(serviceSource).toContain('maxDepth: 14')
  })

  test('has medium preset (depth 17)', () => {
    expect(serviceSource).toContain('medium:')
    expect(serviceSource).toContain('maxDepth: 17')
  })

  test('has large preset (depth 20)', () => {
    expect(serviceSource).toContain('large:')
    expect(serviceSource).toContain('maxDepth: 20')
  })
})

describe('CompressedNFTService capacity monitoring', () => {
  test('has 80% capacity alert threshold', () => {
    expect(serviceSource).toContain('TREE_CAPACITY_ALERT_THRESHOLD = 0.80')
  })

  test('caches tree stats', () => {
    expect(serviceSource).toContain("TREE_STATS_CACHE_KEY = 'cnft_tree_stats'")
  })

  test('has 60 second cache TTL', () => {
    expect(serviceSource).toContain('TREE_STATS_CACHE_TTL = 60')
  })
})

describe('CompressedNFTService RPC integration', () => {
  test('uses getAssetProof RPC method for proofs', () => {
    expect(serviceSource).toContain("'getAssetProof'")
  })

  test('uses AbortSignal timeout', () => {
    expect(serviceSource).toContain('AbortSignal.timeout(10_000)')
  })
})

describe('CompressedNFTService database integration', () => {
  test('queries nfts table for compression data', () => {
    expect(serviceSource).toContain("selectFrom('nfts')")
    expect(serviceSource).toContain("'is_compressed'")
    expect(serviceSource).toContain("'tree_address'")
    expect(serviceSource).toContain("'leaf_index'")
  })

  test('queries merkle_trees table', () => {
    expect(serviceSource).toContain("selectFrom('merkle_trees')")
  })

  test('inserts into merkle_trees table', () => {
    expect(serviceSource).toContain("insertInto('merkle_trees')")
  })

  test('updates merkle_trees usage', () => {
    expect(serviceSource).toContain("updateTable('merkle_trees')")
  })
})

// ============================================
// Runtime tests
// ============================================

describe('CompressedNFTService runtime - presets', () => {
  test('getPreset returns small preset', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    const preset = compressedNFTService.getPreset('small')
    expect(preset).toBeDefined()
    expect(preset!.maxDepth).toBe(14)
    expect(preset!.maxBufferSize).toBe(64)
    expect(preset!.canopyDepth).toBe(11)
  })

  test('getPreset returns medium preset', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    const preset = compressedNFTService.getPreset('medium')
    expect(preset).toBeDefined()
    expect(preset!.maxDepth).toBe(17)
  })

  test('getPreset returns large preset', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    const preset = compressedNFTService.getPreset('large')
    expect(preset).toBeDefined()
    expect(preset!.maxDepth).toBe(20)
  })

  test('getPreset returns undefined for unknown', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    expect(compressedNFTService.getPreset('nonexistent')).toBeUndefined()
  })

  test('getPresets includes capacity', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    const presets = compressedNFTService.getPresets()
    expect(presets.small.capacity).toBe(16384) // 2^14
    expect(presets.medium.capacity).toBe(131072) // 2^17
    expect(presets.large.capacity).toBe(1048576) // 2^20
  })
})

describe('CompressedNFTService runtime - calculateCapacity', () => {
  test('calculates 2^14 = 16384', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    expect(compressedNFTService.calculateCapacity(14)).toBe(16384)
  })

  test('calculates 2^17 = 131072', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    expect(compressedNFTService.calculateCapacity(17)).toBe(131072)
  })

  test('calculates 2^20 = 1048576', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    expect(compressedNFTService.calculateCapacity(20)).toBe(1048576)
  })

  test('calculates 2^3 = 8', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    expect(compressedNFTService.calculateCapacity(3)).toBe(8)
  })
})

describe('CompressedNFTService runtime - estimateTreeCost', () => {
  test('returns a positive number for small preset', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    const cost = compressedNFTService.estimateTreeCost({ maxDepth: 14, maxBufferSize: 64, canopyDepth: 11 })
    expect(cost).toBeGreaterThan(0)
  })

  test('larger trees cost more', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    const smallCost = compressedNFTService.estimateTreeCost({ maxDepth: 14, maxBufferSize: 64, canopyDepth: 11 })
    const largeCost = compressedNFTService.estimateTreeCost({ maxDepth: 20, maxBufferSize: 256, canopyDepth: 17 })
    expect(largeCost).toBeGreaterThan(smallCost)
  })

  test('returns a number with at most 2 decimal places', async () => {
    const { compressedNFTService } = await import('../../../app/Services/CompressedNFTService')
    const cost = compressedNFTService.estimateTreeCost({ maxDepth: 14, maxBufferSize: 64, canopyDepth: 11 })
    const decimals = cost.toString().split('.')[1]
    if (decimals) {
      expect(decimals.length).toBeLessThanOrEqual(2)
    }
  })
})
