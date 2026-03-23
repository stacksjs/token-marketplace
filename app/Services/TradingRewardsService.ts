/**
 * Trading Rewards Service
 *
 * Incentivizes marketplace activity through a points-based rewards program.
 * Users earn points for buying, selling, listing, making offers, and referrals.
 * Tier multipliers reward high-volume traders with bonus points.
 *
 * Features:
 *   - Points per action (buy, sell, list, offer, referral)
 *   - Volume-based tier multipliers (Bronze → Diamond)
 *   - Seasonal leaderboards
 *   - Wallet stats and tier lookup
 */

import { db } from '@stacksjs/database'
import { cache } from './CacheService'

// ============================================
// Types
// ============================================

export type RewardAction = 'buy' | 'sell' | 'list' | 'offer' | 'referral'

export interface RewardTier {
  name: string
  minVolume: number
  multiplier: number
}

export interface ActivityResult {
  points: number
  tier: string
  multiplier: number
  totalPoints: number
}

export interface LeaderboardEntry {
  wallet: string
  total_points: number | string
  trade_count: number | string
}

export interface WalletStats {
  wallet: string
  season: string
  totalPoints: number
  tradeCount: number
  tier: RewardTier
  volume30d: number
  breakdown: Record<RewardAction, number>
}

// ============================================
// Constants
// ============================================

const POINTS_PER_ACTION: Record<RewardAction, number> = {
  buy: 100,
  sell: 50,
  list: 10,
  offer: 5,
  referral: 200,
}

const TIERS: RewardTier[] = [
  { name: 'Bronze', minVolume: 0, multiplier: 1 },
  { name: 'Silver', minVolume: 10, multiplier: 1.5 },
  { name: 'Gold', minVolume: 50, multiplier: 2 },
  { name: 'Diamond', minVolume: 200, multiplier: 3 },
]

const LEADERBOARD_CACHE_TTL = 60 // 60 seconds
const MAX_LEADERBOARD_LIMIT = 200
const DEFAULT_LEADERBOARD_LIMIT = 50

// ============================================
// TradingRewardsService
// ============================================

class TradingRewardsService {
  /**
   * Record a trading activity and award points.
   */
  async recordActivity(wallet: string, action: RewardAction, solAmount: number = 1): Promise<ActivityResult> {
    if (!wallet || !wallet.trim()) {
      throw new Error('Wallet address is required')
    }

    if (!POINTS_PER_ACTION[action]) {
      throw new Error(`Invalid action: ${action}`)
    }

    if (solAmount < 0) {
      throw new Error('SOL amount cannot be negative')
    }

    const basePoints = POINTS_PER_ACTION[action] * solAmount
    const tier = await this.getUserTier(wallet)
    const points = Math.floor(basePoints * tier.multiplier)
    const season = this.getCurrentSeason()

    try {
      await db
        .insertInto('trading_rewards')
        .values({
          wallet,
          action,
          points,
          sol_amount: solAmount,
          multiplier: tier.multiplier,
          season,
          created_at: new Date().toISOString(),
        })
        .execute()
    }
    catch {
      throw new Error('Failed to record activity')
    }

    // Invalidate leaderboard cache
    cache.delete(`leaderboard:${season}`)

    const totalPoints = await this.getTotalPoints(wallet)

    return {
      points,
      tier: tier.name,
      multiplier: tier.multiplier,
      totalPoints,
    }
  }

  /**
   * Get the leaderboard for a season.
   */
  async getLeaderboard(season?: string, limit: number = DEFAULT_LEADERBOARD_LIMIT): Promise<LeaderboardEntry[]> {
    const targetSeason = season || this.getCurrentSeason()
    const effectiveLimit = Math.min(limit, MAX_LEADERBOARD_LIMIT)
    const cacheKey = `leaderboard:${targetSeason}:${effectiveLimit}`

    const cached = cache.get<LeaderboardEntry[]>(cacheKey)
    if (cached) return cached

    try {
      const results = await db
        .selectFrom('trading_rewards')
        .where('season', '=', targetSeason)
        .groupBy('wallet')
        .select([
          'wallet',
          db.fn.sum('points').as('total_points'),
          db.fn.count('id').as('trade_count'),
        ])
        .orderBy('total_points', 'desc')
        .limit(effectiveLimit)
        .execute()

      const entries = results as LeaderboardEntry[]
      cache.set(cacheKey, entries, LEADERBOARD_CACHE_TTL)
      return entries
    }
    catch {
      return []
    }
  }

  /**
   * Get detailed stats for a wallet in the current season.
   */
  async getWalletStats(wallet: string): Promise<WalletStats> {
    const season = this.getCurrentSeason()
    const tier = await this.getUserTier(wallet)

    const totalPoints = await this.getTotalPoints(wallet)

    // Get trade count
    let tradeCount = 0
    try {
      const countResult = await db
        .selectFrom('trading_rewards')
        .where('wallet', '=', wallet)
        .where('season', '=', season)
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst()
      tradeCount = Number(countResult?.count || 0)
    }
    catch {
      // Table may not exist
    }

    // Get 30d volume
    const volume30d = await this.get30dVolume(wallet)

    // Get breakdown by action
    const breakdown = await this.getActionBreakdown(wallet, season)

    return {
      wallet,
      season,
      totalPoints,
      tradeCount,
      tier,
      volume30d,
      breakdown,
    }
  }

  /**
   * Determine the user's tier based on 30-day trading volume.
   */
  async getUserTier(wallet: string): Promise<RewardTier> {
    const volume = await this.get30dVolume(wallet)
    return this.getTierForVolume(volume)
  }

  /**
   * Get the tier for a given volume (pure function).
   */
  getTierForVolume(volume: number): RewardTier {
    const sorted = [...TIERS].sort((a, b) => b.minVolume - a.minVolume)
    return sorted.find(t => volume >= t.minVolume) || TIERS[0]
  }

  /**
   * Get the current season identifier (YYYY-SN format).
   */
  getCurrentSeason(): string {
    const now = new Date()
    return `${now.getFullYear()}-S${Math.ceil((now.getMonth() + 1) / 3)}`
  }

  /**
   * Get total points for a wallet in the current season.
   */
  async getTotalPoints(wallet: string): Promise<number> {
    const season = this.getCurrentSeason()

    try {
      const result = await db
        .selectFrom('trading_rewards')
        .where('wallet', '=', wallet)
        .where('season', '=', season)
        .select(db.fn.sum('points').as('total'))
        .executeTakeFirst()

      return Number(result?.total || 0)
    }
    catch {
      return 0
    }
  }

  /**
   * Get available reward actions and their base point values.
   */
  getPointsConfig(): Record<RewardAction, number> {
    return { ...POINTS_PER_ACTION }
  }

  /**
   * Get all tier definitions.
   */
  getTiers(): RewardTier[] {
    return [...TIERS]
  }

  /**
   * Get 30-day trading volume for a wallet (in SOL).
   */
  private async get30dVolume(wallet: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

      const result = await db
        .selectFrom('marketplace_events')
        .where('from_wallet', '=', wallet)
        .where('type', '=', 'sale')
        .where('created_at', '>=', thirtyDaysAgo)
        .select(db.fn.sum('price').as('volume'))
        .executeTakeFirst()

      return Number(result?.volume || 0)
    }
    catch {
      return 0
    }
  }

  /**
   * Get points breakdown by action type.
   */
  private async getActionBreakdown(wallet: string, season: string): Promise<Record<RewardAction, number>> {
    const breakdown: Record<RewardAction, number> = {
      buy: 0,
      sell: 0,
      list: 0,
      offer: 0,
      referral: 0,
    }

    try {
      const results = await db
        .selectFrom('trading_rewards')
        .where('wallet', '=', wallet)
        .where('season', '=', season)
        .groupBy('action')
        .select([
          'action',
          db.fn.sum('points').as('total'),
        ])
        .execute()

      for (const row of results) {
        const action = row.action as RewardAction
        if (action in breakdown) {
          breakdown[action] = Number(row.total || 0)
        }
      }
    }
    catch {
      // Table may not exist
    }

    return breakdown
  }
}

// Singleton
export const tradingRewards = new TradingRewardsService()
export default TradingRewardsService
