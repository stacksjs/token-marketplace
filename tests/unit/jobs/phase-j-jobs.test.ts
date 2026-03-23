import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// ExpireOffersJob
// ============================================

const expirePath = 'app/Jobs/ExpireOffersJob.ts'
const expireSource = readFileSync(expirePath, 'utf-8')

describe('ExpireOffersJob file structure', () => {
  test('file exists', () => {
    expect(existsSync(expirePath)).toBe(true)
  })

  test('exports runExpireOffersJob function', () => {
    expect(expireSource).toContain('export async function runExpireOffersJob()')
  })

  test('exports startExpireOffersSchedule function', () => {
    expect(expireSource).toContain('export function startExpireOffersSchedule(')
  })

  test('exports ExpireOffersResult interface', () => {
    expect(expireSource).toContain('export interface ExpireOffersResult')
  })

  test('returns expiredCount and errors', () => {
    expect(expireSource).toContain('expiredCount')
    expect(expireSource).toContain('errors')
    expect(expireSource).toContain('processedAt')
  })
})

describe('ExpireOffersJob logic', () => {
  test('queries active offers past expiry', () => {
    expect(expireSource).toContain("'active'")
    expect(expireSource).toContain("'expires_at'")
  })

  test('updates offer status to expired', () => {
    expect(expireSource).toContain("status: 'expired'")
  })

  test('records marketplace event', () => {
    expect(expireSource).toContain('indexerService.recordEvent')
    expect(expireSource).toContain("'offer_expired'")
  })

  test('notifies via WebSocket', () => {
    expect(expireSource).toContain('wsService.broadcastMarketplaceEvent')
  })

  test('handles missing table gracefully', () => {
    expect(expireSource).toContain('catch')
    expect(expireSource).toContain('// Table may not exist yet')
  })

  test('schedule returns cleanup function', () => {
    expect(expireSource).toContain('clearInterval(timer)')
    expect(expireSource).toContain('() => void')
  })

  test('default interval is 60 seconds', () => {
    expect(expireSource).toContain('60_000')
  })
})

// ============================================
// SettleAuctionsJob
// ============================================

const settlePath = 'app/Jobs/SettleAuctionsJob.ts'
const settleSource = readFileSync(settlePath, 'utf-8')

describe('SettleAuctionsJob file structure', () => {
  test('file exists', () => {
    expect(existsSync(settlePath)).toBe(true)
  })

  test('exports runSettleAuctionsJob function', () => {
    expect(settleSource).toContain('export async function runSettleAuctionsJob()')
  })

  test('exports startSettleAuctionsSchedule function', () => {
    expect(settleSource).toContain('export function startSettleAuctionsSchedule(')
  })

  test('exports SettleAuctionsResult interface', () => {
    expect(settleSource).toContain('export interface SettleAuctionsResult')
  })

  test('tracks settled, failed, extended counts', () => {
    expect(settleSource).toContain('settled: number')
    expect(settleSource).toContain('failed: number')
    expect(settleSource).toContain('extended: number')
  })
})

describe('SettleAuctionsJob settlement logic', () => {
  test('finds active auctions past end time', () => {
    expect(settleSource).toContain("'active'")
    expect(settleSource).toContain("'ends_at'")
  })

  test('gets highest bid', () => {
    expect(settleSource).toContain("selectFrom('bids')")
    expect(settleSource).toContain("orderBy('amount', 'desc')")
    expect(settleSource).toContain('limit(1)')
  })

  test('checks reserve price', () => {
    expect(settleSource).toContain('reserve_price')
    expect(settleSource).toContain('reservePrice')
  })

  test('updates status to settled on success', () => {
    expect(settleSource).toContain("status: 'settled'")
  })

  test('updates status to failed when reserve not met', () => {
    expect(settleSource).toContain("status: 'failed'")
  })

  test('records marketplace events', () => {
    expect(settleSource).toContain('indexerService.recordEvent')
    expect(settleSource).toContain("'auction_settled'")
  })
})

describe('SettleAuctionsJob anti-snipe', () => {
  test('has checkAntiSnipe function', () => {
    expect(settleSource).toContain('async function checkAntiSnipe')
  })

  test('checks anti_snipe_minutes', () => {
    expect(settleSource).toContain('anti_snipe_minutes')
    expect(settleSource).toContain('antiSnipeMinutes')
  })

  test('checks for bids in snipe window', () => {
    expect(settleSource).toContain('snipeWindow')
  })

  test('extends auction end time', () => {
    expect(settleSource).toContain('newEnd')
    expect(settleSource).toContain('ends_at: newEnd.toISOString()')
  })

  test('notifies about extension via WebSocket', () => {
    expect(settleSource).toContain("'auction_extended'")
  })
})

describe('SettleAuctionsJob WebSocket notifications', () => {
  test('has notifyAuctionResult function', () => {
    expect(settleSource).toContain('function notifyAuctionResult')
  })

  test('broadcasts auction results', () => {
    expect(settleSource).toContain('wsService.broadcastMarketplaceEvent')
  })
})

// ============================================
// SnapshotCollectionStatsJob
// ============================================

const snapshotPath = 'app/Jobs/SnapshotCollectionStatsJob.ts'
const snapshotSource = readFileSync(snapshotPath, 'utf-8')

describe('SnapshotCollectionStatsJob file structure', () => {
  test('file exists', () => {
    expect(existsSync(snapshotPath)).toBe(true)
  })

  test('exports runSnapshotCollectionStatsJob function', () => {
    expect(snapshotSource).toContain('export async function runSnapshotCollectionStatsJob()')
  })

  test('exports startSnapshotSchedule function', () => {
    expect(snapshotSource).toContain('export function startSnapshotSchedule(')
  })

  test('exports SnapshotResult interface', () => {
    expect(snapshotSource).toContain('export interface SnapshotResult')
  })

  test('exports getCollectionHistory function', () => {
    expect(snapshotSource).toContain('export async function getCollectionHistory(')
  })
})

describe('SnapshotCollectionStatsJob snapshot logic', () => {
  test('queries all collections', () => {
    expect(snapshotSource).toContain("selectFrom('collections')")
  })

  test('captures floor_price', () => {
    expect(snapshotSource).toContain('floor_price')
  })

  test('captures listed_count', () => {
    expect(snapshotSource).toContain('listed_count')
  })

  test('captures total_volume', () => {
    expect(snapshotSource).toContain('total_volume')
  })

  test('captures total_sales', () => {
    expect(snapshotSource).toContain('total_sales')
  })

  test('counts unique holders', () => {
    expect(snapshotSource).toContain('unique_holders')
    expect(snapshotSource).toContain('uniqueHolders')
  })

  test('calculates average price', () => {
    expect(snapshotSource).toContain('avg_price')
    expect(snapshotSource).toContain('avgPrice')
  })

  test('inserts into collection_stats_snapshots', () => {
    expect(snapshotSource).toContain("insertInto('collection_stats_snapshots')")
  })
})

describe('SnapshotCollectionStatsJob history query', () => {
  test('supports 24h period', () => {
    expect(snapshotSource).toContain("'24h'")
  })

  test('supports 7d period', () => {
    expect(snapshotSource).toContain("'7d'")
  })

  test('supports 30d period', () => {
    expect(snapshotSource).toContain("'30d'")
  })

  test('supports all period', () => {
    expect(snapshotSource).toContain("'all'")
  })

  test('orders by snapshot_at ascending', () => {
    expect(snapshotSource).toContain("orderBy('snapshot_at', 'asc')")
  })
})

describe('SnapshotCollectionStatsJob scheduling', () => {
  test('default interval is 1 hour', () => {
    expect(snapshotSource).toContain('3600_000')
  })

  test('schedule returns cleanup function', () => {
    expect(snapshotSource).toContain('clearInterval(timer)')
  })
})

// ============================================
// Migration files
// ============================================

const statsSnapshotMigration = 'database/migrations/1770353251-create-collection-stats-snapshots-table.sql'
const auctionMigration = 'database/migrations/1770353252-add-auction-enhancements.sql'

describe('collection_stats_snapshots migration', () => {
  test('file exists', () => {
    expect(existsSync(statsSnapshotMigration)).toBe(true)
  })

  const source = readFileSync(statsSnapshotMigration, 'utf-8')

  test('creates collection_stats_snapshots table', () => {
    expect(source).toContain('CREATE TABLE IF NOT EXISTS collection_stats_snapshots')
  })

  test('has collection_id column', () => {
    expect(source).toContain('collection_id INTEGER NOT NULL')
  })

  test('has floor_price column', () => {
    expect(source).toContain('floor_price INTEGER')
  })

  test('has listed_count column', () => {
    expect(source).toContain('listed_count INTEGER')
  })

  test('has total_volume column', () => {
    expect(source).toContain('total_volume INTEGER')
  })

  test('has unique_holders column', () => {
    expect(source).toContain('unique_holders INTEGER')
  })

  test('has avg_price column', () => {
    expect(source).toContain('avg_price INTEGER')
  })

  test('has snapshot_at column', () => {
    expect(source).toContain('snapshot_at TEXT NOT NULL')
  })

  test('has foreign key to collections', () => {
    expect(source).toContain('FOREIGN KEY (collection_id) REFERENCES collections(id)')
  })

  test('has composite index on collection_id + snapshot_at', () => {
    expect(source).toContain('idx_stats_snapshots_collection_time')
  })

  test('has index on snapshot_at', () => {
    expect(source).toContain('idx_stats_snapshots_time')
  })
})

describe('auction enhancements migration', () => {
  test('file exists', () => {
    expect(existsSync(auctionMigration)).toBe(true)
  })

  const source = readFileSync(auctionMigration, 'utf-8')

  test('adds min_bid_increment column', () => {
    expect(source).toContain('min_bid_increment INTEGER')
  })

  test('adds anti_snipe_minutes column', () => {
    expect(source).toContain('anti_snipe_minutes INTEGER')
  })

  test('adds price_curve column', () => {
    expect(source).toContain('price_curve TEXT')
  })

  test('adds composite index on status + ends_at', () => {
    expect(source).toContain('idx_auctions_status_ends_at')
    expect(source).toContain('auctions(status, ends_at)')
  })

  test('adds index on seller', () => {
    expect(source).toContain('idx_auctions_seller')
  })

  test('adds index on mint_address', () => {
    expect(source).toContain('idx_auctions_mint')
  })
})
