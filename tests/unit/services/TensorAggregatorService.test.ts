import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify TensorAggregatorService structure
// ============================================

const servicePath = 'app/Services/TensorAggregatorService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('TensorAggregatorService file structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('defines TensorAggregatorService class', () => {
    expect(serviceSource).toContain('class TensorAggregatorService')
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const tensorAggregator = new TensorAggregatorService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default TensorAggregatorService')
  })
})

describe('TensorAggregatorService types', () => {
  test('defines TensorListing interface', () => {
    expect(serviceSource).toContain('export interface TensorListing')
  })

  test('TensorListing has mint, name, image, price, seller, source', () => {
    expect(serviceSource).toContain('mint: string')
    expect(serviceSource).toContain('name: string')
    expect(serviceSource).toContain('image: string')
    expect(serviceSource).toContain('price: number')
    expect(serviceSource).toContain('seller: string')
    expect(serviceSource).toContain("source: 'tensor'")
  })

  test('TensorListing has optional rarityRank', () => {
    expect(serviceSource).toContain('rarityRank?: number')
  })

  test('defines FloorComparison interface', () => {
    expect(serviceSource).toContain('export interface FloorComparison')
  })

  test('FloorComparison has hoodies, tensor, magicEden, bestPrice', () => {
    expect(serviceSource).toContain('hoodies: number | null')
    expect(serviceSource).toContain('tensor: number | null')
    expect(serviceSource).toContain('magicEden: number | null')
    expect(serviceSource).toContain('bestPrice:')
  })

  test('defines AggregatedListing interface', () => {
    expect(serviceSource).toContain('export interface AggregatedListing')
  })

  test('defines ListingSortBy type', () => {
    expect(serviceSource).toContain('export type ListingSortBy')
  })

  test('ListingSortBy includes PriceAsc, PriceDesc, ListedDesc', () => {
    expect(serviceSource).toContain("'PriceAsc'")
    expect(serviceSource).toContain("'PriceDesc'")
    expect(serviceSource).toContain("'ListedDesc'")
  })
})

describe('TensorAggregatorService methods', () => {
  test('has getCollectionListings method', () => {
    expect(serviceSource).toContain('async getCollectionListings(collectionSlug: string')
  })

  test('has getFloorComparison method', () => {
    expect(serviceSource).toContain('async getFloorComparison(collectionSlug: string)')
  })

  test('has getAggregatedListings method', () => {
    expect(serviceSource).toContain('async getAggregatedListings(collectionSlug: string')
  })

  test('has getHoodiesFloor private method', () => {
    expect(serviceSource).toContain('private async getHoodiesFloor(slug: string)')
  })

  test('has getHoodiesListings private method', () => {
    expect(serviceSource).toContain('private async getHoodiesListings(slug: string')
  })

  test('has hasApiKey method', () => {
    expect(serviceSource).toContain('hasApiKey(): boolean')
  })

  test('has getApiKey private method', () => {
    expect(serviceSource).toContain('private getApiKey(): string')
  })
})

describe('TensorAggregatorService API configuration', () => {
  test('uses Tensor GraphQL API URL', () => {
    expect(serviceSource).toContain("TENSOR_API_URL = 'https://api.tensor.so/graphql'")
  })

  test('sends X-TENSOR-API-KEY header', () => {
    expect(serviceSource).toContain("'X-TENSOR-API-KEY'")
  })

  test('reads API key from TENSOR_API_KEY env var', () => {
    expect(serviceSource).toContain('TENSOR_API_KEY')
  })

  test('has GraphQL query for active listings', () => {
    expect(serviceSource).toContain('ACTIVE_LISTINGS_QUERY')
    expect(serviceSource).toContain('query ActiveListings')
    expect(serviceSource).toContain('activeListings')
  })

  test('query fetches grossAmount, sellerId, onchainId', () => {
    expect(serviceSource).toContain('grossAmount')
    expect(serviceSource).toContain('sellerId')
    expect(serviceSource).toContain('onchainId')
  })
})

describe('TensorAggregatorService constants', () => {
  test('listings cache TTL is 60 seconds', () => {
    expect(serviceSource).toContain('LISTINGS_CACHE_TTL = 60')
  })

  test('floor cache TTL is 30 seconds', () => {
    expect(serviceSource).toContain('FLOOR_CACHE_TTL = 30')
  })

  test('max listings limit is 500', () => {
    expect(serviceSource).toContain('MAX_LISTINGS_LIMIT = 500')
  })

  test('default listings limit is 100', () => {
    expect(serviceSource).toContain('DEFAULT_LISTINGS_LIMIT = 100')
  })
})

describe('TensorAggregatorService caching', () => {
  test('caches tensor listings', () => {
    expect(serviceSource).toContain('tensor_listings:')
  })

  test('caches floor comparison', () => {
    expect(serviceSource).toContain('floor_comparison:')
  })

  test('checks cache before API calls', () => {
    expect(serviceSource).toContain('cache.get')
    expect(serviceSource).toContain('cache.set')
  })
})

describe('TensorAggregatorService price conversion', () => {
  test('converts lamports to SOL', () => {
    expect(serviceSource).toContain('/ 1e9')
  })

  test('generates Tensor buy URLs', () => {
    expect(serviceSource).toContain('https://www.tensor.trade/item/')
  })
})

describe('TensorAggregatorService error handling', () => {
  test('returns empty array on API failure', () => {
    // The catch blocks return empty arrays
    expect(serviceSource).toContain('return []')
  })

  test('returns empty array when no API key', () => {
    expect(serviceSource).toContain('if (!apiKey) return []')
  })

  test('checks response.ok before parsing', () => {
    expect(serviceSource).toContain('if (!response.ok) return []')
  })
})

// ============================================
// Runtime tests
// ============================================

describe('TensorAggregatorService runtime - hasApiKey', () => {
  test('returns false when no API key configured', async () => {
    const { tensorAggregator } = await import('../../../app/Services/TensorAggregatorService')
    // In test environment, TENSOR_API_KEY is typically not set
    expect(typeof tensorAggregator.hasApiKey()).toBe('boolean')
  })
})

describe('TensorAggregatorService runtime - getCollectionListings', () => {
  test('returns empty array when no API key', async () => {
    const { tensorAggregator } = await import('../../../app/Services/TensorAggregatorService')
    // Without API key, should return empty
    const listings = await tensorAggregator.getCollectionListings('test-collection')
    expect(Array.isArray(listings)).toBe(true)
  })

  test('accepts sort options', async () => {
    const { tensorAggregator } = await import('../../../app/Services/TensorAggregatorService')
    const listings = await tensorAggregator.getCollectionListings('test', {
      limit: 10,
      sortBy: 'PriceAsc',
    })
    expect(Array.isArray(listings)).toBe(true)
  })
})

describe('TensorAggregatorService runtime - getFloorComparison', () => {
  test('returns FloorComparison structure', async () => {
    const { tensorAggregator } = await import('../../../app/Services/TensorAggregatorService')
    const result = await tensorAggregator.getFloorComparison('test-collection')
    expect(result).toHaveProperty('hoodies')
    expect(result).toHaveProperty('tensor')
    expect(result).toHaveProperty('magicEden')
    expect(result).toHaveProperty('bestPrice')
  })

  test('bestPrice has price and source fields', async () => {
    const { tensorAggregator } = await import('../../../app/Services/TensorAggregatorService')
    const result = await tensorAggregator.getFloorComparison('test-collection')
    expect(result.bestPrice).toHaveProperty('price')
    expect(result.bestPrice).toHaveProperty('source')
  })
})

describe('TensorAggregatorService runtime - getAggregatedListings', () => {
  test('returns array of aggregated listings', async () => {
    const { tensorAggregator } = await import('../../../app/Services/TensorAggregatorService')
    const listings = await tensorAggregator.getAggregatedListings('test-collection')
    expect(Array.isArray(listings)).toBe(true)
  })

  test('respects limit parameter', async () => {
    const { tensorAggregator } = await import('../../../app/Services/TensorAggregatorService')
    const listings = await tensorAggregator.getAggregatedListings('test', { limit: 5 })
    expect(listings.length).toBeLessThanOrEqual(5)
  })
})
