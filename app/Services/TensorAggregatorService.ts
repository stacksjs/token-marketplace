/**
 * Tensor Aggregator Service
 *
 * Aggregates NFT listings from Tensor alongside native Hoodies listings.
 * Provides cross-marketplace floor price comparison and best-price discovery.
 *
 * Features:
 *   - Fetch active Tensor listings via GraphQL API
 *   - Floor price comparison across marketplaces
 *   - Best-price badge support
 *   - Response caching to reduce API calls
 */

import { db } from '@stacksjs/database'
import { cache } from './CacheService'

// ============================================
// Types
// ============================================

export interface TensorListing {
  mint: string
  name: string
  image: string
  price: number
  seller: string
  source: 'tensor'
  rarityRank?: number
}

export interface FloorComparison {
  hoodies: number | null
  tensor: number | null
  magicEden: number | null
  bestPrice: { price: number, source: string }
}

export interface AggregatedListing {
  mint: string
  name: string
  image: string
  price: number
  seller: string
  source: 'hoodies' | 'tensor'
  rarityRank?: number
  buyUrl?: string
}

export type ListingSortBy = 'PriceAsc' | 'PriceDesc' | 'ListedDesc'

// ============================================
// Constants
// ============================================

const TENSOR_API_URL = 'https://api.tensor.so/graphql'
const LISTINGS_CACHE_TTL = 60 // 60 seconds
const FLOOR_CACHE_TTL = 30 // 30 seconds
const MAX_LISTINGS_LIMIT = 500
const DEFAULT_LISTINGS_LIMIT = 100

// ============================================
// GraphQL Query
// ============================================

const ACTIVE_LISTINGS_QUERY = `
  query ActiveListings($slug: String!, $limit: Int, $sortBy: ActiveListingsSortBy) {
    activeListings(slug: $slug, sortBy: $sortBy, limit: $limit) {
      txs {
        tx {
          grossAmount
          grossAmountUnit
          sellerId
          source
        }
        mint {
          onchainId
          name
          imageUri
          rarityRankHR
        }
      }
    }
  }
`

// ============================================
// TensorAggregatorService
// ============================================

class TensorAggregatorService {
  private apiUrl: string = TENSOR_API_URL

  /**
   * Fetch active listings from Tensor for a collection.
   */
  async getCollectionListings(collectionSlug: string, options: {
    limit?: number
    sortBy?: ListingSortBy
  } = {}): Promise<TensorListing[]> {
    const limit = Math.min(options.limit || DEFAULT_LISTINGS_LIMIT, MAX_LISTINGS_LIMIT)
    const sortBy = options.sortBy || 'PriceAsc'
    const cacheKey = `tensor_listings:${collectionSlug}:${sortBy}:${limit}`

    const cached = cache.get<TensorListing[]>(cacheKey)
    if (cached) return cached

    const apiKey = this.getApiKey()
    if (!apiKey) return []

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TENSOR-API-KEY': apiKey,
        },
        body: JSON.stringify({
          query: ACTIVE_LISTINGS_QUERY,
          variables: { slug: collectionSlug, limit, sortBy },
        }),
      })

      if (!response.ok) return []

      const { data } = await response.json() as any

      const listings: TensorListing[] = (data?.activeListings?.txs || []).map((item: any) => ({
        mint: item.mint.onchainId,
        name: item.mint.name || '',
        image: item.mint.imageUri || '',
        price: Number(item.tx.grossAmount) / 1e9, // lamports to SOL
        seller: item.tx.sellerId,
        source: 'tensor' as const,
        rarityRank: item.mint.rarityRankHR || undefined,
      }))

      cache.set(cacheKey, listings, LISTINGS_CACHE_TTL)
      return listings
    }
    catch {
      return []
    }
  }

  /**
   * Get floor price comparison across marketplaces.
   */
  async getFloorComparison(collectionSlug: string): Promise<FloorComparison> {
    const cacheKey = `floor_comparison:${collectionSlug}`
    const cached = cache.get<FloorComparison>(cacheKey)
    if (cached) return cached

    const [tensorListings, hoodiesFloor] = await Promise.all([
      this.getCollectionListings(collectionSlug, { limit: 1, sortBy: 'PriceAsc' }),
      this.getHoodiesFloor(collectionSlug),
    ])

    const tensorFloor = tensorListings[0]?.price || null

    const prices = [
      tensorFloor !== null ? { price: tensorFloor, source: 'tensor' } : null,
      hoodiesFloor !== null ? { price: hoodiesFloor, source: 'hoodies' } : null,
    ].filter(Boolean) as Array<{ price: number, source: string }>

    prices.sort((a, b) => a.price - b.price)

    const result: FloorComparison = {
      hoodies: hoodiesFloor,
      tensor: tensorFloor,
      magicEden: null, // Future integration
      bestPrice: prices[0] || { price: 0, source: 'none' },
    }

    cache.set(cacheKey, result, FLOOR_CACHE_TTL)
    return result
  }

  /**
   * Get aggregated listings from all sources, merged and sorted by price.
   */
  async getAggregatedListings(collectionSlug: string, options: {
    limit?: number
    sortBy?: ListingSortBy
  } = {}): Promise<AggregatedListing[]> {
    const limit = Math.min(options.limit || DEFAULT_LISTINGS_LIMIT, MAX_LISTINGS_LIMIT)

    const [tensorListings, hoodiesListings] = await Promise.all([
      this.getCollectionListings(collectionSlug, { limit, sortBy: options.sortBy }),
      this.getHoodiesListings(collectionSlug, limit),
    ])

    const aggregated: AggregatedListing[] = [
      ...hoodiesListings.map(l => ({ ...l, source: 'hoodies' as const })),
      ...tensorListings.map(l => ({
        ...l,
        source: 'tensor' as const,
        buyUrl: `https://www.tensor.trade/item/${l.mint}`,
      })),
    ]

    // Sort by price ascending by default
    const sortBy = options.sortBy || 'PriceAsc'
    if (sortBy === 'PriceAsc') {
      aggregated.sort((a, b) => a.price - b.price)
    }
    else if (sortBy === 'PriceDesc') {
      aggregated.sort((a, b) => b.price - a.price)
    }

    return aggregated.slice(0, limit)
  }

  /**
   * Get the Hoodies marketplace floor price for a collection.
   */
  private async getHoodiesFloor(slug: string): Promise<number | null> {
    try {
      const result = await db
        .selectFrom('nfts')
        .innerJoin('collections', 'collections.id', 'nfts.collection_id')
        .where('collections.slug', '=', slug)
        .where('nfts.status', '=', 'listed')
        .orderBy('nfts.listing_price', 'asc')
        .select('nfts.listing_price')
        .limit(1)
        .executeTakeFirst()

      return result?.listing_price ? Number(result.listing_price) : null
    }
    catch {
      return null
    }
  }

  /**
   * Get native Hoodies listings for a collection.
   */
  private async getHoodiesListings(slug: string, limit: number): Promise<AggregatedListing[]> {
    try {
      const results = await db
        .selectFrom('nfts')
        .innerJoin('collections', 'collections.id', 'nfts.collection_id')
        .where('collections.slug', '=', slug)
        .where('nfts.status', '=', 'listed')
        .orderBy('nfts.listing_price', 'asc')
        .select([
          'nfts.mint_address as mint',
          'nfts.name',
          'nfts.image',
          'nfts.listing_price',
          'nfts.owner_wallet',
        ])
        .limit(limit)
        .execute()

      return results.map(r => ({
        mint: r.mint || '',
        name: r.name || '',
        image: r.image || '',
        price: Number(r.listing_price || 0),
        seller: r.owner_wallet || '',
        source: 'hoodies' as const,
      }))
    }
    catch {
      return []
    }
  }

  /**
   * Check if Tensor API key is configured.
   */
  hasApiKey(): boolean {
    return !!this.getApiKey()
  }

  /**
   * Get the Tensor API key from environment.
   */
  private getApiKey(): string {
    return (typeof Bun !== 'undefined' ? Bun.env : process.env).TENSOR_API_KEY || ''
  }
}

// Singleton
export const tensorAggregator = new TensorAggregatorService()
export default TensorAggregatorService
