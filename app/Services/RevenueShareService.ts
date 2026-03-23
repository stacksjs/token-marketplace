/**
 * Revenue Share Service
 *
 * Implements the community-owned marketplace model. Platform fees from
 * every sale are split between the DAO treasury and staking rewards pool.
 *
 * This is the key differentiator from Tensor/Magic Eden:
 *   - 50% of platform fees go to DAO treasury (community-governed spending)
 *   - 50% go to staking rewards (distributed to NFT stakers)
 *   - Split ratios are configurable per collection via governance
 *
 * Integration points:
 *   - Called from BuyNftAction / AcceptOfferAction after successful sales
 *   - Revenue stats surfaced via API endpoints
 *   - Governance proposals can modify the fee split
 */

import { db } from '@stacksjs/database'
import { cache } from './CacheService'

// ============================================
// Types
// ============================================

export interface SaleEvent {
  totalPrice: number
  platformFee: number
  txSignature: string
  collectionId: string
  nftMint?: string
  buyerWallet?: string
  sellerWallet?: string
}

export interface RevenueStats {
  totalFees: number
  totalTreasury: number
  totalStakingRewards: number
  salesCount: number
  period: string
}

export interface CollectionRevenueConfig {
  collectionId: string
  treasurySplitPct: number // 0-100, default 50
  stakingSplitPct: number  // 0-100, default 50
}

export interface RevenueDistribution {
  id: number
  collectionId: string
  totalFee: number
  treasuryShare: number
  stakingShare: number
  treasurySplitPct: number
  txSignature: string | null
  saleAmount: number | null
  buyerWallet: string | null
  sellerWallet: string | null
  nftMint: string | null
  createdAt: string
}

// ============================================
// Constants
// ============================================

const DEFAULT_TREASURY_SPLIT = 50 // 50% to treasury, 50% to staking
const REVENUE_STATS_CACHE_TTL = 30 // 30 seconds

// ============================================
// RevenueShareService
// ============================================

class RevenueShareService {
  private collectionConfigs: Map<string, CollectionRevenueConfig> = new Map()

  /**
   * Distribute platform fee from a successful sale.
   * Called after every marketplace transaction.
   */
  async distributePlatformFee(event: SaleEvent): Promise<RevenueDistribution | null> {
    const { platformFee, collectionId, txSignature } = event

    if (platformFee <= 0) return null

    const config = this.getCollectionConfig(collectionId)
    const treasuryShare = platformFee * (config.treasurySplitPct / 100)
    const stakingShare = platformFee * (config.stakingSplitPct / 100)

    try {
      const result = await db
        .insertInto('revenue_distributions')
        .values({
          collection_id: collectionId,
          total_fee: platformFee,
          treasury_share: treasuryShare,
          staking_share: stakingShare,
          treasury_split_pct: config.treasurySplitPct,
          tx_signature: txSignature,
          sale_amount: event.totalPrice,
          buyer_wallet: event.buyerWallet || null,
          seller_wallet: event.sellerWallet || null,
          nft_mint: event.nftMint || null,
          created_at: new Date().toISOString(),
        })
        .execute()

      // Invalidate cached stats
      cache.delete(`revenue_stats:${collectionId}`)

      const distribution: RevenueDistribution = {
        id: Number(result?.[0]?.insertId || 0),
        collectionId,
        totalFee: platformFee,
        treasuryShare,
        stakingShare,
        treasurySplitPct: config.treasurySplitPct,
        txSignature,
        saleAmount: event.totalPrice,
        buyerWallet: event.buyerWallet || null,
        sellerWallet: event.sellerWallet || null,
        nftMint: event.nftMint || null,
        createdAt: new Date().toISOString(),
      }

      return distribution
    }
    catch {
      return null
    }
  }

  /**
   * Get revenue statistics for a collection over a time period.
   */
  async getRevenueStats(
    collectionId: string,
    period: '24h' | '7d' | '30d' | 'all' = '7d',
  ): Promise<RevenueStats> {
    const cacheKey = `revenue_stats:${collectionId}:${period}`
    const cached = cache.get<RevenueStats>(cacheKey)
    if (cached) return cached

    const since = this.periodToDate(period)

    try {
      let query = db
        .selectFrom('revenue_distributions')
        .where('collection_id', '=', collectionId)

      if (since) {
        query = query.where('created_at', '>=', since.toISOString()) as any
      }

      const result = await query
        .select([
          db.fn.sum('total_fee').as('totalFees'),
          db.fn.sum('treasury_share').as('totalTreasury'),
          db.fn.sum('staking_share').as('totalStakingRewards'),
          db.fn.count('id').as('salesCount'),
        ])
        .executeTakeFirst()

      const stats: RevenueStats = {
        totalFees: Number(result?.totalFees || 0),
        totalTreasury: Number(result?.totalTreasury || 0),
        totalStakingRewards: Number(result?.totalStakingRewards || 0),
        salesCount: Number(result?.salesCount || 0),
        period,
      }

      cache.set(cacheKey, stats, REVENUE_STATS_CACHE_TTL)
      return stats
    }
    catch {
      return {
        totalFees: 0,
        totalTreasury: 0,
        totalStakingRewards: 0,
        salesCount: 0,
        period,
      }
    }
  }

  /**
   * Get recent revenue distributions for a collection.
   */
  async getRecentDistributions(
    collectionId: string,
    limit: number = 20,
  ): Promise<RevenueDistribution[]> {
    try {
      const rows = await db
        .selectFrom('revenue_distributions')
        .selectAll()
        .where('collection_id', '=', collectionId)
        .orderBy('created_at', 'desc')
        .limit(Math.min(limit, 100))
        .execute()

      return rows.map(row => this.formatDistribution(row))
    }
    catch {
      return []
    }
  }

  /**
   * Get global revenue stats across all collections.
   */
  async getGlobalRevenueStats(period: '24h' | '7d' | '30d' | 'all' = '7d'): Promise<RevenueStats> {
    const cacheKey = `revenue_stats:global:${period}`
    const cached = cache.get<RevenueStats>(cacheKey)
    if (cached) return cached

    const since = this.periodToDate(period)

    try {
      let query = db.selectFrom('revenue_distributions') as any

      if (since) {
        query = query.where('created_at', '>=', since.toISOString())
      }

      const result = await query
        .select([
          db.fn.sum('total_fee').as('totalFees'),
          db.fn.sum('treasury_share').as('totalTreasury'),
          db.fn.sum('staking_share').as('totalStakingRewards'),
          db.fn.count('id').as('salesCount'),
        ])
        .executeTakeFirst()

      const stats: RevenueStats = {
        totalFees: Number(result?.totalFees || 0),
        totalTreasury: Number(result?.totalTreasury || 0),
        totalStakingRewards: Number(result?.totalStakingRewards || 0),
        salesCount: Number(result?.salesCount || 0),
        period,
      }

      cache.set(cacheKey, stats, REVENUE_STATS_CACHE_TTL)
      return stats
    }
    catch {
      return { totalFees: 0, totalTreasury: 0, totalStakingRewards: 0, salesCount: 0, period }
    }
  }

  /**
   * Get or set the revenue config for a collection.
   */
  getCollectionConfig(collectionId: string): CollectionRevenueConfig {
    const existing = this.collectionConfigs.get(collectionId)
    if (existing) return existing

    return {
      collectionId,
      treasurySplitPct: DEFAULT_TREASURY_SPLIT,
      stakingSplitPct: 100 - DEFAULT_TREASURY_SPLIT,
    }
  }

  /**
   * Update the fee split for a collection (via governance).
   */
  setCollectionConfig(collectionId: string, treasurySplitPct: number): void {
    const clamped = Math.min(100, Math.max(0, Math.round(treasurySplitPct)))
    this.collectionConfigs.set(collectionId, {
      collectionId,
      treasurySplitPct: clamped,
      stakingSplitPct: 100 - clamped,
    })
  }

  /**
   * Calculate the platform fee for a given sale amount.
   * Default: 1% of sale price.
   */
  calculatePlatformFee(saleAmount: number, feeRateBps: number = 100): number {
    return saleAmount * (feeRateBps / 10_000)
  }

  /**
   * Convert a period string to a Date.
   */
  private periodToDate(period: string): Date | null {
    const now = Date.now()
    switch (period) {
      case '24h':
        return new Date(now - 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now - 30 * 24 * 60 * 60 * 1000)
      case 'all':
        return null
      default:
        return new Date(now - 7 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Format a raw DB row into RevenueDistribution.
   */
  private formatDistribution(row: any): RevenueDistribution {
    return {
      id: Number(row.id),
      collectionId: row.collection_id,
      totalFee: Number(row.total_fee),
      treasuryShare: Number(row.treasury_share),
      stakingShare: Number(row.staking_share),
      treasurySplitPct: Number(row.treasury_split_pct),
      txSignature: row.tx_signature,
      saleAmount: row.sale_amount ? Number(row.sale_amount) : null,
      buyerWallet: row.buyer_wallet,
      sellerWallet: row.seller_wallet,
      nftMint: row.nft_mint,
      createdAt: row.created_at,
    }
  }
}

// Singleton
export const revenueShareService = new RevenueShareService()
export default RevenueShareService
