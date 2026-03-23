import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify RevenueShareService structure
// ============================================

const servicePath = 'app/Services/RevenueShareService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('RevenueShareService file structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('defines RevenueShareService class', () => {
    expect(serviceSource).toContain('class RevenueShareService')
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const revenueShareService = new RevenueShareService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default RevenueShareService')
  })
})

describe('RevenueShareService types', () => {
  test('defines SaleEvent interface', () => {
    expect(serviceSource).toContain('export interface SaleEvent')
  })

  test('SaleEvent has totalPrice and platformFee', () => {
    expect(serviceSource).toContain('totalPrice: number')
    expect(serviceSource).toContain('platformFee: number')
  })

  test('defines RevenueStats interface', () => {
    expect(serviceSource).toContain('export interface RevenueStats')
  })

  test('RevenueStats has totalFees, totalTreasury, totalStakingRewards', () => {
    expect(serviceSource).toContain('totalFees: number')
    expect(serviceSource).toContain('totalTreasury: number')
    expect(serviceSource).toContain('totalStakingRewards: number')
  })

  test('defines CollectionRevenueConfig interface', () => {
    expect(serviceSource).toContain('export interface CollectionRevenueConfig')
  })

  test('CollectionRevenueConfig has treasurySplitPct', () => {
    expect(serviceSource).toContain('treasurySplitPct: number')
    expect(serviceSource).toContain('stakingSplitPct: number')
  })

  test('defines RevenueDistribution interface', () => {
    expect(serviceSource).toContain('export interface RevenueDistribution')
  })
})

describe('RevenueShareService methods', () => {
  test('has distributePlatformFee method', () => {
    expect(serviceSource).toContain('async distributePlatformFee(event: SaleEvent)')
  })

  test('has getRevenueStats method', () => {
    expect(serviceSource).toContain('async getRevenueStats(')
  })

  test('has getRecentDistributions method', () => {
    expect(serviceSource).toContain('async getRecentDistributions(')
  })

  test('has getGlobalRevenueStats method', () => {
    expect(serviceSource).toContain('async getGlobalRevenueStats(')
  })

  test('has getCollectionConfig method', () => {
    expect(serviceSource).toContain('getCollectionConfig(collectionId: string)')
  })

  test('has setCollectionConfig method', () => {
    expect(serviceSource).toContain('setCollectionConfig(collectionId: string')
  })

  test('has calculatePlatformFee method', () => {
    expect(serviceSource).toContain('calculatePlatformFee(saleAmount: number')
  })
})

describe('RevenueShareService fee splitting', () => {
  test('default treasury split is 50%', () => {
    expect(serviceSource).toContain('DEFAULT_TREASURY_SPLIT = 50')
  })

  test('calculates treasury share from split', () => {
    expect(serviceSource).toContain('platformFee * (config.treasurySplitPct / 100)')
  })

  test('calculates staking share from split', () => {
    expect(serviceSource).toContain('platformFee * (config.stakingSplitPct / 100)')
  })

  test('default fee rate is 1% (100 bps)', () => {
    expect(serviceSource).toContain('feeRateBps: number = 100')
  })
})

describe('RevenueShareService database integration', () => {
  test('inserts into revenue_distributions table', () => {
    expect(serviceSource).toContain("insertInto('revenue_distributions')")
  })

  test('queries revenue_distributions for stats', () => {
    expect(serviceSource).toContain("selectFrom('revenue_distributions')")
  })

  test('uses sum aggregations for stats', () => {
    expect(serviceSource).toContain("db.fn.sum('total_fee')")
    expect(serviceSource).toContain("db.fn.sum('treasury_share')")
    expect(serviceSource).toContain("db.fn.sum('staking_share')")
  })
})

describe('RevenueShareService caching', () => {
  test('uses cache service', () => {
    expect(serviceSource).toContain("import { cache } from './CacheService'")
  })

  test('has 30 second cache TTL', () => {
    expect(serviceSource).toContain('REVENUE_STATS_CACHE_TTL = 30')
  })

  test('invalidates cache on new distribution', () => {
    expect(serviceSource).toContain('cache.delete')
  })
})

describe('RevenueShareService time periods', () => {
  test('supports 24h period', () => {
    expect(serviceSource).toContain("'24h'")
  })

  test('supports 7d period', () => {
    expect(serviceSource).toContain("'7d'")
  })

  test('supports 30d period', () => {
    expect(serviceSource).toContain("'30d'")
  })

  test('supports all period', () => {
    expect(serviceSource).toContain("'all'")
  })
})

// ============================================
// Runtime tests
// ============================================

describe('RevenueShareService runtime - config', () => {
  test('getCollectionConfig returns default 50/50 split', async () => {
    const { revenueShareService } = await import('../../../app/Services/RevenueShareService')
    const config = revenueShareService.getCollectionConfig('test-collection')
    expect(config.treasurySplitPct).toBe(50)
    expect(config.stakingSplitPct).toBe(50)
  })

  test('setCollectionConfig updates split', async () => {
    const { revenueShareService } = await import('../../../app/Services/RevenueShareService')
    revenueShareService.setCollectionConfig('test-collection-2', 30)
    const config = revenueShareService.getCollectionConfig('test-collection-2')
    expect(config.treasurySplitPct).toBe(30)
    expect(config.stakingSplitPct).toBe(70)
  })

  test('setCollectionConfig clamps to 0-100', async () => {
    const { revenueShareService } = await import('../../../app/Services/RevenueShareService')
    revenueShareService.setCollectionConfig('test-clamp', 150)
    const config = revenueShareService.getCollectionConfig('test-clamp')
    expect(config.treasurySplitPct).toBe(100)
    expect(config.stakingSplitPct).toBe(0)
  })

  test('setCollectionConfig clamps negative to 0', async () => {
    const { revenueShareService } = await import('../../../app/Services/RevenueShareService')
    revenueShareService.setCollectionConfig('test-neg', -10)
    const config = revenueShareService.getCollectionConfig('test-neg')
    expect(config.treasurySplitPct).toBe(0)
    expect(config.stakingSplitPct).toBe(100)
  })
})

describe('RevenueShareService runtime - fee calculation', () => {
  test('calculates 1% fee by default', async () => {
    const { revenueShareService } = await import('../../../app/Services/RevenueShareService')
    const fee = revenueShareService.calculatePlatformFee(100)
    expect(fee).toBe(1) // 1% of 100
  })

  test('calculates custom fee rate', async () => {
    const { revenueShareService } = await import('../../../app/Services/RevenueShareService')
    const fee = revenueShareService.calculatePlatformFee(100, 250) // 2.5%
    expect(fee).toBe(2.5)
  })

  test('handles zero sale amount', async () => {
    const { revenueShareService } = await import('../../../app/Services/RevenueShareService')
    const fee = revenueShareService.calculatePlatformFee(0)
    expect(fee).toBe(0)
  })
})

// ============================================
// Revenue Stats Action
// ============================================

const actionPath = 'app/Actions/Revenue/RevenueStatsAction.ts'
const actionSource = readFileSync(actionPath, 'utf-8')

describe('RevenueStatsAction file structure', () => {
  test('file exists', () => {
    expect(existsSync(actionPath)).toBe(true)
  })

  test('imports revenueShareService', () => {
    expect(actionSource).toContain('revenueShareService')
  })

  test('is a GET method', () => {
    expect(actionSource).toContain("method: 'GET'")
  })

  test('supports collection-specific and global stats', () => {
    expect(actionSource).toContain('getRevenueStats(collectionId')
    expect(actionSource).toContain('getGlobalRevenueStats')
  })

  test('supports period parameter', () => {
    expect(actionSource).toContain("searchParams.get('period')")
  })

  test('returns recent distributions for collection view', () => {
    expect(actionSource).toContain('getRecentDistributions')
  })

  test('returns config for collection view', () => {
    expect(actionSource).toContain('getCollectionConfig')
  })
})

// ============================================
// Routes
// ============================================

const routesSource = readFileSync('routes/api.ts', 'utf-8')

describe('Revenue routes', () => {
  test('global stats route exists', () => {
    expect(routesSource).toContain("route.get('/revenue/stats', 'Actions/Revenue/RevenueStatsAction')")
  })

  test('collection stats route exists', () => {
    expect(routesSource).toContain("route.get('/revenue/stats/{collectionId}', 'Actions/Revenue/RevenueStatsAction')")
  })
})

// ============================================
// Migration
// ============================================

const migrationPath = 'database/migrations/1770353253-create-revenue-distributions-table.sql'

describe('revenue_distributions migration', () => {
  test('file exists', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  const source = readFileSync(migrationPath, 'utf-8')

  test('creates revenue_distributions table', () => {
    expect(source).toContain('CREATE TABLE IF NOT EXISTS revenue_distributions')
  })

  test('has collection_id column', () => {
    expect(source).toContain('collection_id TEXT NOT NULL')
  })

  test('has total_fee column', () => {
    expect(source).toContain('total_fee REAL NOT NULL')
  })

  test('has treasury_share column', () => {
    expect(source).toContain('treasury_share REAL NOT NULL')
  })

  test('has staking_share column', () => {
    expect(source).toContain('staking_share REAL NOT NULL')
  })

  test('has treasury_split_pct column', () => {
    expect(source).toContain('treasury_split_pct INTEGER NOT NULL DEFAULT 50')
  })

  test('has tx_signature column', () => {
    expect(source).toContain('tx_signature TEXT')
  })

  test('has sale_amount column', () => {
    expect(source).toContain('sale_amount REAL')
  })

  test('has buyer_wallet and seller_wallet columns', () => {
    expect(source).toContain('buyer_wallet TEXT')
    expect(source).toContain('seller_wallet TEXT')
  })

  test('has index on collection_id', () => {
    expect(source).toContain('idx_revenue_dist_collection')
  })

  test('has index on created_at', () => {
    expect(source).toContain('idx_revenue_dist_created')
  })

  test('has index on tx_signature', () => {
    expect(source).toContain('idx_revenue_dist_tx')
  })
})
