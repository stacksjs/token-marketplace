import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify cNFT action files
// ============================================

const mintPath = 'app/Actions/CompressedNFT/MintCompressedAction.ts'
const treePath = 'app/Actions/CompressedNFT/CreateMerkleTreeAction.ts'
const statusPath = 'app/Actions/CompressedNFT/TreeStatusAction.ts'
const mintSource = readFileSync(mintPath, 'utf-8')
const treeSource = readFileSync(treePath, 'utf-8')
const statusSource = readFileSync(statusPath, 'utf-8')

describe('MintCompressedAction file structure', () => {
  test('file exists', () => {
    expect(existsSync(mintPath)).toBe(true)
  })

  test('imports Action from stacksjs', () => {
    expect(mintSource).toContain("import { Action } from '@stacksjs/actions'")
  })

  test('imports compressedNFTService', () => {
    expect(mintSource).toContain('compressedNFTService')
  })

  test('imports indexerService', () => {
    expect(mintSource).toContain('indexerService')
  })

  test('exports Action with name', () => {
    expect(mintSource).toContain("name: 'Mint Compressed NFT'")
  })

  test('is a POST method', () => {
    expect(mintSource).toContain("method: 'POST'")
  })
})

describe('MintCompressedAction validation', () => {
  test('requires collectionSlug and wallet', () => {
    expect(mintSource).toContain('collectionSlug')
    expect(mintSource).toContain('wallet')
    expect(mintSource).toContain("'collectionSlug and wallet are required'")
  })

  test('validates quantity range', () => {
    expect(mintSource).toContain('quantity < 1 || quantity > 100')
  })

  test('checks collection exists', () => {
    expect(mintSource).toContain("'Collection not found'")
    expect(mintSource).toContain('404')
  })

  test('checks tree capacity', () => {
    expect(mintSource).toContain('remainingCapacity < quantity')
    expect(mintSource).toContain("'No merkle tree with sufficient capacity'")
  })
})

describe('MintCompressedAction minting flow', () => {
  test('uses findAvailableTree', () => {
    expect(mintSource).toContain('compressedNFTService.findAvailableTree')
  })

  test('calls indexerService.indexOnMint', () => {
    expect(mintSource).toContain('indexerService.indexOnMint')
  })

  test('passes compressed flag', () => {
    expect(mintSource).toContain('compressed: true')
  })

  test('passes tree address and leaf index', () => {
    expect(mintSource).toContain('treeAddress: tree.address')
    expect(mintSource).toContain('leafIndex')
  })

  test('increments tree usage after minting', () => {
    expect(mintSource).toContain('compressedNFTService.incrementTreeUsage')
  })

  test('returns minted items in response', () => {
    expect(mintSource).toContain('success: true')
    expect(mintSource).toContain('minted:')
    expect(mintSource).toContain('items:')
  })
})

describe('CreateMerkleTreeAction file structure', () => {
  test('file exists', () => {
    expect(existsSync(treePath)).toBe(true)
  })

  test('imports compressedNFTService', () => {
    expect(treeSource).toContain('compressedNFTService')
  })

  test('exports Action with name', () => {
    expect(treeSource).toContain("name: 'Create Merkle Tree'")
  })

  test('is a POST method', () => {
    expect(treeSource).toContain("method: 'POST'")
  })
})

describe('CreateMerkleTreeAction validation', () => {
  test('requires collectionId', () => {
    expect(treeSource).toContain("'collectionId is required'")
  })

  test('supports preset parameter', () => {
    expect(treeSource).toContain('compressedNFTService.getPreset(preset)')
  })

  test('validates maxDepth range', () => {
    expect(treeSource).toContain('config.maxDepth < 3 || config.maxDepth > 30')
  })
})

describe('CreateMerkleTreeAction response', () => {
  test('returns capacity', () => {
    expect(treeSource).toContain('compressedNFTService.calculateCapacity')
  })

  test('returns estimated cost', () => {
    expect(treeSource).toContain('compressedNFTService.estimateTreeCost')
    expect(treeSource).toContain('estimatedCostSol')
  })

  test('registers tree in DB', () => {
    expect(treeSource).toContain('compressedNFTService.registerTree')
  })
})

describe('TreeStatusAction file structure', () => {
  test('file exists', () => {
    expect(existsSync(statusPath)).toBe(true)
  })

  test('imports compressedNFTService', () => {
    expect(statusSource).toContain('compressedNFTService')
  })

  test('exports Action with name', () => {
    expect(statusSource).toContain("name: 'Merkle Tree Status'")
  })

  test('is a GET method', () => {
    expect(statusSource).toContain("method: 'GET'")
  })
})

describe('TreeStatusAction response', () => {
  test('returns overall stats when no collectionId', () => {
    expect(statusSource).toContain('compressedNFTService.getStats()')
  })

  test('returns collection trees when collectionId provided', () => {
    expect(statusSource).toContain('compressedNFTService.getCollectionTrees(collectionId)')
  })

  test('returns trees near capacity', () => {
    expect(statusSource).toContain('compressedNFTService.getTreesNearCapacity')
  })

  test('returns presets', () => {
    expect(statusSource).toContain('compressedNFTService.getPresets()')
  })
})

// ============================================
// Verify routes
// ============================================

const routesPath = 'routes/api.ts'
const routesSource = readFileSync(routesPath, 'utf-8')

describe('cNFT routes', () => {
  test('mint route exists', () => {
    expect(routesSource).toContain("route.post('/mint', 'Actions/CompressedNFT/MintCompressedAction')")
  })

  test('create tree route exists', () => {
    expect(routesSource).toContain("route.post('/tree', 'Actions/CompressedNFT/CreateMerkleTreeAction')")
  })

  test('tree status route exists', () => {
    expect(routesSource).toContain("route.get('/trees', 'Actions/CompressedNFT/TreeStatusAction')")
  })

  test('collection tree status route exists', () => {
    expect(routesSource).toContain("route.get('/trees/{collectionId}', 'Actions/CompressedNFT/TreeStatusAction')")
  })

  test('routes are grouped under /cnft prefix', () => {
    expect(routesSource).toContain("prefix: '/cnft'")
  })
})

// ============================================
// Verify migration
// ============================================

const migrationPath = 'database/migrations/1770353250-create-merkle-trees-table.sql'
const migrationSource = readFileSync(migrationPath, 'utf-8')

describe('merkle_trees migration', () => {
  test('migration file exists', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  test('creates merkle_trees table', () => {
    expect(migrationSource).toContain('CREATE TABLE IF NOT EXISTS merkle_trees')
  })

  test('has address column (unique)', () => {
    expect(migrationSource).toContain('address TEXT NOT NULL UNIQUE')
  })

  test('has collection_id column', () => {
    expect(migrationSource).toContain('collection_id TEXT NOT NULL')
  })

  test('has max_depth column', () => {
    expect(migrationSource).toContain('max_depth INTEGER NOT NULL')
  })

  test('has max_buffer_size column', () => {
    expect(migrationSource).toContain('max_buffer_size INTEGER NOT NULL')
  })

  test('has canopy_depth column', () => {
    expect(migrationSource).toContain('canopy_depth INTEGER NOT NULL')
  })

  test('has capacity column', () => {
    expect(migrationSource).toContain('capacity INTEGER NOT NULL')
  })

  test('has used_leaves column', () => {
    expect(migrationSource).toContain('used_leaves INTEGER NOT NULL DEFAULT 0')
  })

  test('has status column', () => {
    expect(migrationSource).toContain("status TEXT NOT NULL DEFAULT 'active'")
  })

  test('has index on collection_id', () => {
    expect(migrationSource).toContain('idx_merkle_trees_collection_id')
  })

  test('has index on status', () => {
    expect(migrationSource).toContain('idx_merkle_trees_status')
  })

  test('has index on usage', () => {
    expect(migrationSource).toContain('idx_merkle_trees_usage')
  })
})
