import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: Actions and Routes for Phase F
// ============================================

// ============================================
// Rewards Actions
// ============================================

const leaderboardPath = 'app/Actions/Rewards/LeaderboardAction.ts'
const walletRewardsPath = 'app/Actions/Rewards/WalletRewardsAction.ts'
const recordActivityPath = 'app/Actions/Rewards/RecordActivityAction.ts'

describe('LeaderboardAction', () => {
  test('file exists', () => {
    expect(existsSync(leaderboardPath)).toBe(true)
  })

  const source = readFileSync(leaderboardPath, 'utf-8')

  test('is a GET method', () => {
    expect(source).toContain("method: 'GET'")
  })

  test('imports tradingRewards from TradingRewardsService', () => {
    expect(source).toContain('tradingRewards')
    expect(source).toContain('TradingRewardsService')
  })

  test('calls getLeaderboard', () => {
    expect(source).toContain('tradingRewards.getLeaderboard')
  })

  test('supports season parameter', () => {
    expect(source).toContain('season')
  })

  test('supports limit parameter', () => {
    expect(source).toContain('limit')
  })

  test('returns tiers in response', () => {
    expect(source).toContain('tradingRewards.getTiers()')
  })

  test('returns current season', () => {
    expect(source).toContain('tradingRewards.getCurrentSeason()')
  })
})

describe('WalletRewardsAction', () => {
  test('file exists', () => {
    expect(existsSync(walletRewardsPath)).toBe(true)
  })

  const source = readFileSync(walletRewardsPath, 'utf-8')

  test('is a GET method', () => {
    expect(source).toContain("method: 'GET'")
  })

  test('imports tradingRewards', () => {
    expect(source).toContain('tradingRewards')
  })

  test('gets wallet from params', () => {
    expect(source).toContain("getParam?.('wallet')")
  })

  test('validates wallet is provided', () => {
    expect(source).toContain("'Wallet address is required'")
  })

  test('returns 400 for missing wallet', () => {
    expect(source).toContain('400')
  })

  test('calls getWalletStats', () => {
    expect(source).toContain('tradingRewards.getWalletStats')
  })
})

describe('RecordActivityAction', () => {
  test('file exists', () => {
    expect(existsSync(recordActivityPath)).toBe(true)
  })

  const source = readFileSync(recordActivityPath, 'utf-8')

  test('is a POST method', () => {
    expect(source).toContain("method: 'POST'")
  })

  test('imports tradingRewards', () => {
    expect(source).toContain('tradingRewards')
  })

  test('validates wallet and action required', () => {
    expect(source).toContain("'wallet and action are required'")
  })

  test('validates action against VALID_ACTIONS', () => {
    expect(source).toContain('VALID_ACTIONS')
    expect(source).toContain('Invalid action')
  })

  test('calls recordActivity', () => {
    expect(source).toContain('tradingRewards.recordActivity')
  })

  test('handles errors', () => {
    expect(source).toContain('catch')
    expect(source).toContain('500')
  })
})

// ============================================
// Marketplace Aggregation Actions
// ============================================

const floorComparisonPath = 'app/Actions/Marketplace/FloorComparisonAction.ts'
const aggregatedListingsPath = 'app/Actions/Marketplace/AggregatedListingsAction.ts'

describe('FloorComparisonAction', () => {
  test('file exists', () => {
    expect(existsSync(floorComparisonPath)).toBe(true)
  })

  const source = readFileSync(floorComparisonPath, 'utf-8')

  test('is a GET method', () => {
    expect(source).toContain("method: 'GET'")
  })

  test('imports tensorAggregator', () => {
    expect(source).toContain('tensorAggregator')
    expect(source).toContain('TensorAggregatorService')
  })

  test('gets slug from params', () => {
    expect(source).toContain("getParam?.('slug')")
  })

  test('validates slug is provided', () => {
    expect(source).toContain("'Collection slug is required'")
    expect(source).toContain('400')
  })

  test('calls getFloorComparison', () => {
    expect(source).toContain('tensorAggregator.getFloorComparison')
  })

  test('reports API configuration status', () => {
    expect(source).toContain('apiConfigured')
    expect(source).toContain('tensorAggregator.hasApiKey()')
  })
})

describe('AggregatedListingsAction', () => {
  test('file exists', () => {
    expect(existsSync(aggregatedListingsPath)).toBe(true)
  })

  const source = readFileSync(aggregatedListingsPath, 'utf-8')

  test('is a GET method', () => {
    expect(source).toContain("method: 'GET'")
  })

  test('imports tensorAggregator', () => {
    expect(source).toContain('tensorAggregator')
    expect(source).toContain('TensorAggregatorService')
  })

  test('checks hasApiKey before Tensor fetch', () => {
    expect(source).toContain('tensorAggregator.hasApiKey()')
  })

  test('includes Tensor buy URL', () => {
    expect(source).toContain('tensor.trade')
  })
})

// ============================================
// Routes
// ============================================

const routesSource = readFileSync('routes/api.ts', 'utf-8')

describe('Trading Rewards routes', () => {
  test('leaderboard route exists', () => {
    expect(routesSource).toContain("route.get('/leaderboard', 'Actions/Rewards/LeaderboardAction')")
  })

  test('wallet rewards route exists', () => {
    expect(routesSource).toContain("route.get('/wallet/{wallet}', 'Actions/Rewards/WalletRewardsAction')")
  })

  test('record activity route exists', () => {
    expect(routesSource).toContain("route.post('/record', 'Actions/Rewards/RecordActivityAction')")
  })

  test('routes grouped under /rewards', () => {
    expect(routesSource).toContain("prefix: '/rewards'")
  })
})

describe('Floor comparison route', () => {
  test('floor comparison route exists', () => {
    expect(routesSource).toContain("route.get('/marketplace/floor/{slug}', 'Actions/Marketplace/FloorComparisonAction')")
  })
})

// ============================================
// Migration
// ============================================

const migrationPath = 'database/migrations/1770353254-create-trading-rewards-table.sql'

describe('Trading rewards migration', () => {
  test('migration file exists', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  const source = readFileSync(migrationPath, 'utf-8')

  test('creates trading_rewards table', () => {
    expect(source).toContain('CREATE TABLE IF NOT EXISTS trading_rewards')
  })

  test('has wallet column', () => {
    expect(source).toContain('wallet TEXT NOT NULL')
  })

  test('has action column with CHECK constraint', () => {
    expect(source).toContain('action TEXT NOT NULL')
    expect(source).toContain("CHECK(action IN ('buy', 'sell', 'list', 'offer', 'referral'))")
  })

  test('has points column', () => {
    expect(source).toContain('points INTEGER NOT NULL')
  })

  test('has sol_amount column', () => {
    expect(source).toContain('sol_amount REAL NOT NULL')
  })

  test('has multiplier column', () => {
    expect(source).toContain('multiplier REAL NOT NULL')
  })

  test('has season column', () => {
    expect(source).toContain('season TEXT NOT NULL')
  })

  test('has created_at column', () => {
    expect(source).toContain('created_at TEXT NOT NULL')
  })

  test('has index on wallet', () => {
    expect(source).toContain('idx_trading_rewards_wallet')
  })

  test('has index on season', () => {
    expect(source).toContain('idx_trading_rewards_season')
  })

  test('has composite index on wallet+season', () => {
    expect(source).toContain('idx_trading_rewards_wallet_season')
  })

  test('has index on action', () => {
    expect(source).toContain('idx_trading_rewards_action')
  })
})
