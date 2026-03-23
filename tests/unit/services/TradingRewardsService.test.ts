import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify TradingRewardsService structure
// ============================================

const servicePath = 'app/Services/TradingRewardsService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('TradingRewardsService file structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('defines TradingRewardsService class', () => {
    expect(serviceSource).toContain('class TradingRewardsService')
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const tradingRewards = new TradingRewardsService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default TradingRewardsService')
  })
})

describe('TradingRewardsService types', () => {
  test('defines RewardAction type', () => {
    expect(serviceSource).toContain('export type RewardAction')
  })

  test('RewardAction includes buy, sell, list, offer, referral', () => {
    expect(serviceSource).toContain("'buy'")
    expect(serviceSource).toContain("'sell'")
    expect(serviceSource).toContain("'list'")
    expect(serviceSource).toContain("'offer'")
    expect(serviceSource).toContain("'referral'")
  })

  test('defines RewardTier interface', () => {
    expect(serviceSource).toContain('export interface RewardTier')
  })

  test('RewardTier has name, minVolume, multiplier', () => {
    expect(serviceSource).toContain('name: string')
    expect(serviceSource).toContain('minVolume: number')
    expect(serviceSource).toContain('multiplier: number')
  })

  test('defines ActivityResult interface', () => {
    expect(serviceSource).toContain('export interface ActivityResult')
  })

  test('defines LeaderboardEntry interface', () => {
    expect(serviceSource).toContain('export interface LeaderboardEntry')
  })

  test('defines WalletStats interface', () => {
    expect(serviceSource).toContain('export interface WalletStats')
  })
})

describe('TradingRewardsService points configuration', () => {
  test('buy = 100 points per SOL', () => {
    expect(serviceSource).toContain('buy: 100')
  })

  test('sell = 50 points per SOL', () => {
    expect(serviceSource).toContain('sell: 50')
  })

  test('list = 10 points', () => {
    expect(serviceSource).toContain('list: 10')
  })

  test('offer = 5 points', () => {
    expect(serviceSource).toContain('offer: 5')
  })

  test('referral = 200 points per SOL', () => {
    expect(serviceSource).toContain('referral: 200')
  })
})

describe('TradingRewardsService tier configuration', () => {
  test('Bronze tier starts at 0 SOL with 1x multiplier', () => {
    expect(serviceSource).toContain("name: 'Bronze', minVolume: 0, multiplier: 1")
  })

  test('Silver tier starts at 10 SOL with 1.5x multiplier', () => {
    expect(serviceSource).toContain("name: 'Silver', minVolume: 10, multiplier: 1.5")
  })

  test('Gold tier starts at 50 SOL with 2x multiplier', () => {
    expect(serviceSource).toContain("name: 'Gold', minVolume: 50, multiplier: 2")
  })

  test('Diamond tier starts at 200 SOL with 3x multiplier', () => {
    expect(serviceSource).toContain("name: 'Diamond', minVolume: 200, multiplier: 3")
  })
})

describe('TradingRewardsService methods', () => {
  test('has recordActivity method', () => {
    expect(serviceSource).toContain('async recordActivity(wallet: string, action: RewardAction')
  })

  test('has getLeaderboard method', () => {
    expect(serviceSource).toContain('async getLeaderboard(season?: string')
  })

  test('has getWalletStats method', () => {
    expect(serviceSource).toContain('async getWalletStats(wallet: string)')
  })

  test('has getUserTier method', () => {
    expect(serviceSource).toContain('async getUserTier(wallet: string)')
  })

  test('has getTierForVolume method', () => {
    expect(serviceSource).toContain('getTierForVolume(volume: number)')
  })

  test('has getCurrentSeason method', () => {
    expect(serviceSource).toContain('getCurrentSeason(): string')
  })

  test('has getTotalPoints method', () => {
    expect(serviceSource).toContain('async getTotalPoints(wallet: string)')
  })

  test('has getPointsConfig method', () => {
    expect(serviceSource).toContain('getPointsConfig()')
  })

  test('has getTiers method', () => {
    expect(serviceSource).toContain('getTiers(): RewardTier[]')
  })

  test('has get30dVolume private method', () => {
    expect(serviceSource).toContain('private async get30dVolume(wallet: string)')
  })

  test('has getActionBreakdown private method', () => {
    expect(serviceSource).toContain('private async getActionBreakdown(wallet: string')
  })
})

describe('TradingRewardsService constants', () => {
  test('leaderboard cache TTL is 60 seconds', () => {
    expect(serviceSource).toContain('LEADERBOARD_CACHE_TTL = 60')
  })

  test('max leaderboard limit is 200', () => {
    expect(serviceSource).toContain('MAX_LEADERBOARD_LIMIT = 200')
  })

  test('default leaderboard limit is 50', () => {
    expect(serviceSource).toContain('DEFAULT_LEADERBOARD_LIMIT = 50')
  })
})

describe('TradingRewardsService validation', () => {
  test('validates wallet is required', () => {
    expect(serviceSource).toContain("'Wallet address is required'")
  })

  test('validates action type', () => {
    expect(serviceSource).toContain('Invalid action')
  })

  test('validates SOL amount not negative', () => {
    expect(serviceSource).toContain("'SOL amount cannot be negative'")
  })
})

describe('TradingRewardsService season format', () => {
  test('uses YYYY-SN format', () => {
    expect(serviceSource).toContain('getFullYear()')
    expect(serviceSource).toContain('getMonth()')
    expect(serviceSource).toContain('-S')
  })

  test('calculates quarter from month', () => {
    expect(serviceSource).toContain('Math.ceil((now.getMonth() + 1) / 3)')
  })
})

describe('TradingRewardsService caching', () => {
  test('caches leaderboard data', () => {
    expect(serviceSource).toContain('leaderboard:')
  })

  test('invalidates cache on new activity', () => {
    expect(serviceSource).toContain('cache.delete')
  })
})

describe('TradingRewardsService volume calculation', () => {
  test('uses 30-day window for volume', () => {
    expect(serviceSource).toContain('30 * 86400000')
  })

  test('queries marketplace_events for sales', () => {
    expect(serviceSource).toContain('marketplace_events')
    expect(serviceSource).toContain("'sale'")
  })
})

// ============================================
// Runtime tests
// ============================================

describe('TradingRewardsService runtime - getCurrentSeason', () => {
  test('returns string in YYYY-SN format', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    const season = tradingRewards.getCurrentSeason()
    expect(season).toMatch(/^\d{4}-S[1-4]$/)
  })

  test('returns correct year', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    const season = tradingRewards.getCurrentSeason()
    const year = new Date().getFullYear()
    expect(season.startsWith(String(year))).toBe(true)
  })
})

describe('TradingRewardsService runtime - getTierForVolume', () => {
  test('returns Bronze for 0 volume', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(0).name).toBe('Bronze')
  })

  test('returns Bronze for 5 SOL volume', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(5).name).toBe('Bronze')
  })

  test('returns Silver for 10 SOL volume', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(10).name).toBe('Silver')
  })

  test('returns Silver for 25 SOL volume', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(25).name).toBe('Silver')
  })

  test('returns Gold for 50 SOL volume', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(50).name).toBe('Gold')
  })

  test('returns Gold for 100 SOL volume', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(100).name).toBe('Gold')
  })

  test('returns Diamond for 200 SOL volume', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(200).name).toBe('Diamond')
  })

  test('returns Diamond for 1000 SOL volume', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(1000).name).toBe('Diamond')
  })

  test('Bronze multiplier is 1', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(0).multiplier).toBe(1)
  })

  test('Silver multiplier is 1.5', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(10).multiplier).toBe(1.5)
  })

  test('Gold multiplier is 2', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(50).multiplier).toBe(2)
  })

  test('Diamond multiplier is 3', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTierForVolume(200).multiplier).toBe(3)
  })
})

describe('TradingRewardsService runtime - getPointsConfig', () => {
  test('returns all action point values', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    const config = tradingRewards.getPointsConfig()
    expect(config.buy).toBe(100)
    expect(config.sell).toBe(50)
    expect(config.list).toBe(10)
    expect(config.offer).toBe(5)
    expect(config.referral).toBe(200)
  })

  test('returns a copy, not the original', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    const config1 = tradingRewards.getPointsConfig()
    const config2 = tradingRewards.getPointsConfig()
    expect(config1).not.toBe(config2)
    expect(config1).toEqual(config2)
  })
})

describe('TradingRewardsService runtime - getTiers', () => {
  test('returns 4 tiers', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    expect(tradingRewards.getTiers()).toHaveLength(4)
  })

  test('tiers are ordered by minVolume ascending', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    const tiers = tradingRewards.getTiers()
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].minVolume).toBeGreaterThan(tiers[i - 1].minVolume)
    }
  })

  test('returns a copy, not the original', async () => {
    const { tradingRewards } = await import('../../../app/Services/TradingRewardsService')
    const tiers1 = tradingRewards.getTiers()
    const tiers2 = tradingRewards.getTiers()
    expect(tiers1).not.toBe(tiers2)
  })
})
