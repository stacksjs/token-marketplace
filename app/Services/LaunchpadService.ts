/**
 * Launchpad Service
 *
 * Manages the creator launchpad flow for launching new NFT collections.
 * Provides a structured wizard process: configure → deploy → launch.
 *
 * Features:
 *   - Multi-phase mint support (OG, Allowlist, Public)
 *   - Regular and compressed NFT collections
 *   - Royalty and revenue split configuration
 *   - Creator dashboard data aggregation
 *   - Mint progress tracking
 */

import { db } from '@stacksjs/database'
import { cache } from './CacheService'

// ============================================
// Types
// ============================================

export interface LaunchpadConfig {
  name: string
  symbol: string
  description: string
  externalUrl?: string
  supply: number
  useCompressed: boolean
  sellerFeeBasisPoints: number
  phases: MintPhase[]
  creators: CreatorSplit[]
}

export interface MintPhase {
  name: string
  price: number
  startDate: string
  endDate?: string
  maxPerWallet: number
  allowlist?: string[]
}

export interface CreatorSplit {
  address: string
  share: number
}

export interface LaunchResult {
  success: boolean
  collectionId?: number
  collectionSlug?: string
  candyMachineAddress?: string
  merkleTreeAddress?: string
  error?: string
}

export interface CreatorDashboardData {
  collection: {
    name: string
    slug: string
    supply: number
    mintedCount: number
    mintProgress: number
  }
  revenue: {
    primarySales: number
    secondaryRoyalties: number
    totalRevenue: number
  }
  holders: {
    uniqueHolders: number
    topHolders: Array<{ wallet: string, count: number }>
  }
  recentActivity: any[]
}

export interface LaunchpadStats {
  totalCollections: number
  totalLaunched: number
  pendingApproval: number
  totalMinted: number
}

// ============================================
// Constants
// ============================================

const MAX_SUPPLY = 100_000
const MAX_PHASES = 10
const MAX_CREATORS = 5
const DASHBOARD_CACHE_TTL = 30 // 30 seconds

// ============================================
// LaunchpadService
// ============================================

class LaunchpadService {
  /**
   * Validate a launchpad configuration before deployment.
   */
  validateConfig(config: LaunchpadConfig): { valid: boolean, errors: string[] } {
    const errors: string[] = []

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Collection name is required')
    }

    if (!config.symbol || config.symbol.trim().length === 0) {
      errors.push('Collection symbol is required')
    }

    if (config.symbol && config.symbol.length > 10) {
      errors.push('Symbol must be 10 characters or less')
    }

    if (!config.supply || config.supply < 1) {
      errors.push('Supply must be at least 1')
    }

    if (config.supply > MAX_SUPPLY) {
      errors.push(`Supply cannot exceed ${MAX_SUPPLY}`)
    }

    if (config.sellerFeeBasisPoints < 0 || config.sellerFeeBasisPoints > 10000) {
      errors.push('Royalty must be between 0% and 100% (0-10000 basis points)')
    }

    // Validate phases
    if (!config.phases || config.phases.length === 0) {
      errors.push('At least one mint phase is required')
    }

    if (config.phases && config.phases.length > MAX_PHASES) {
      errors.push(`Maximum ${MAX_PHASES} mint phases allowed`)
    }

    if (config.phases) {
      for (const phase of config.phases) {
        if (!phase.name) errors.push('Each phase must have a name')
        if (phase.price < 0) errors.push(`Phase "${phase.name}": price cannot be negative`)
        if (phase.maxPerWallet < 1) errors.push(`Phase "${phase.name}": maxPerWallet must be at least 1`)
      }
    }

    // Validate creators
    if (!config.creators || config.creators.length === 0) {
      errors.push('At least one creator is required')
    }

    if (config.creators && config.creators.length > MAX_CREATORS) {
      errors.push(`Maximum ${MAX_CREATORS} creators allowed`)
    }

    if (config.creators) {
      const totalShare = config.creators.reduce((sum, c) => sum + c.share, 0)
      if (totalShare !== 100) {
        errors.push(`Creator shares must total 100% (currently ${totalShare}%)`)
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Create a new collection launch (stores in DB as pending).
   */
  async createLaunch(config: LaunchpadConfig): Promise<LaunchResult> {
    const validation = this.validateConfig(config)
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') }
    }

    const slug = this.generateSlug(config.name)

    try {
      // Check for duplicate slug
      const existing = await db
        .selectFrom('collections')
        .select('id')
        .where('slug', '=', slug)
        .executeTakeFirst()

      if (existing) {
        return { success: false, error: 'A collection with this name already exists' }
      }

      // Store collection
      const result = await db
        .insertInto('collections')
        .values({
          name: config.name,
          slug,
          symbol: config.symbol,
          description: config.description,
          supply: config.supply,
          seller_fee_basis_points: config.sellerFeeBasisPoints,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .execute()

      const collectionId = Number(result?.[0]?.insertId || 0)

      return {
        success: true,
        collectionId,
        collectionSlug: slug,
      }
    }
    catch {
      return { success: false, error: 'Failed to create collection' }
    }
  }

  /**
   * Get creator dashboard data for a collection.
   */
  async getCreatorDashboard(collectionSlug: string): Promise<CreatorDashboardData | null> {
    const cacheKey = `creator_dashboard:${collectionSlug}`
    const cached = cache.get<CreatorDashboardData>(cacheKey)
    if (cached) return cached

    try {
      const collection = await db
        .selectFrom('collections')
        .selectAll()
        .where('slug', '=', collectionSlug)
        .executeTakeFirst()

      if (!collection) return null

      // Count minted NFTs
      let mintedCount = 0
      try {
        const mintResult = await db
          .selectFrom('nfts')
          .select(db.fn.count('id').as('count'))
          .where('collection_id', '=', collection.id)
          .executeTakeFirst()
        mintedCount = Number(mintResult?.count || 0)
      }
      catch {
        // Table may not exist
      }

      // Count unique holders
      let uniqueHolders = 0
      const topHolders: Array<{ wallet: string, count: number }> = []
      try {
        const holderResult = await db
          .selectFrom('nfts')
          .select(db.fn.count('id').as('count'))
          .where('collection_id', '=', collection.id)
          .where('owner_wallet', 'is not', null)
          .executeTakeFirst()
        uniqueHolders = Number(holderResult?.count || 0)
      }
      catch {
        // Column may not exist
      }

      // Calculate revenue
      let primarySales = 0
      let secondaryRoyalties = 0
      try {
        const salesResult = await db
          .selectFrom('marketplace_events')
          .select(db.fn.sum('price').as('total'))
          .where('collection_id', '=', String(collection.id))
          .where('type', '=', 'sale')
          .executeTakeFirst()
        primarySales = Number(salesResult?.total || 0)

        // Secondary royalties based on seller_fee_basis_points
        const royaltyRate = Number(collection.seller_fee_basis_points || 0) / 10000
        secondaryRoyalties = primarySales * royaltyRate
      }
      catch {
        // Tables may not exist
      }

      const supply = Number(collection.supply || 0)
      const data: CreatorDashboardData = {
        collection: {
          name: collection.name,
          slug: collection.slug,
          supply,
          mintedCount,
          mintProgress: supply > 0 ? Math.round((mintedCount / supply) * 100) : 0,
        },
        revenue: {
          primarySales,
          secondaryRoyalties,
          totalRevenue: primarySales + secondaryRoyalties,
        },
        holders: {
          uniqueHolders,
          topHolders,
        },
        recentActivity: [],
      }

      cache.set(cacheKey, data, DASHBOARD_CACHE_TTL)
      return data
    }
    catch {
      return null
    }
  }

  /**
   * Get launchpad statistics.
   */
  async getStats(): Promise<LaunchpadStats> {
    try {
      const total = await db
        .selectFrom('collections')
        .select(db.fn.count('id').as('count'))
        .executeTakeFirst()

      const launched = await db
        .selectFrom('collections')
        .select(db.fn.count('id').as('count'))
        .where('status', '=', 'active')
        .executeTakeFirst()

      const pending = await db
        .selectFrom('collections')
        .select(db.fn.count('id').as('count'))
        .where('status', '=', 'pending')
        .executeTakeFirst()

      let totalMinted = 0
      try {
        const minted = await db
          .selectFrom('nfts')
          .select(db.fn.count('id').as('count'))
          .executeTakeFirst()
        totalMinted = Number(minted?.count || 0)
      }
      catch {
        // nfts table may not exist
      }

      return {
        totalCollections: Number(total?.count || 0),
        totalLaunched: Number(launched?.count || 0),
        pendingApproval: Number(pending?.count || 0),
        totalMinted,
      }
    }
    catch {
      return { totalCollections: 0, totalLaunched: 0, pendingApproval: 0, totalMinted: 0 }
    }
  }

  /**
   * Generate a URL-safe slug from a collection name.
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  /**
   * Get max supply constant.
   */
  getMaxSupply(): number {
    return MAX_SUPPLY
  }

  /**
   * Get max phases constant.
   */
  getMaxPhases(): number {
    return MAX_PHASES
  }

  /**
   * Get max creators constant.
   */
  getMaxCreators(): number {
    return MAX_CREATORS
  }
}

// Singleton
export const launchpadService = new LaunchpadService()
export default LaunchpadService
