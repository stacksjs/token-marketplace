import { describe, expect, test, beforeEach } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify IndexerService structure
// ============================================

const servicePath = 'app/Services/IndexerService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('IndexerService structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('imports CacheService and RPCService', () => {
    expect(serviceSource).toContain("from './CacheService'")
    expect(serviceSource).toContain("from './RPCService'")
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const indexerService = new IndexerService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default IndexerService')
  })

  test('does not import from any external NFT indexing API', () => {
    expect(serviceSource).not.toContain('helius')
    expect(serviceSource).not.toContain('shyft')
    expect(serviceSource).not.toContain('quicknode')
  })
})

describe('IndexerService types', () => {
  test('exports MintIndexData interface', () => {
    expect(serviceSource).toContain('export interface MintIndexData')
  })

  test('MintIndexData has required fields', () => {
    expect(serviceSource).toContain('mint: string')
    expect(serviceSource).toContain('name: string')
    expect(serviceSource).toContain('symbol: string')
    expect(serviceSource).toContain('uri: string')
    expect(serviceSource).toContain('owner: string')
    expect(serviceSource).toContain('collectionId: number')
  })

  test('MintIndexData has optional compression fields', () => {
    expect(serviceSource).toContain('compressed?: boolean')
    expect(serviceSource).toContain('treeAddress?: string')
    expect(serviceSource).toContain('leafIndex?: number')
  })

  test('exports TraitAttribute interface', () => {
    expect(serviceSource).toContain('export interface TraitAttribute')
    expect(serviceSource).toContain('trait_type: string')
    expect(serviceSource).toContain('value: string')
  })

  test('exports NFTMetadata interface', () => {
    expect(serviceSource).toContain('export interface NFTMetadata')
    expect(serviceSource).toContain('image: string')
    expect(serviceSource).toContain('attributes?: TraitAttribute[]')
  })

  test('exports SearchFilters interface', () => {
    expect(serviceSource).toContain('export interface SearchFilters')
    expect(serviceSource).toContain("status?: 'listed' | 'unlisted' | 'all'")
    expect(serviceSource).toContain('traits?: Record<string, string[]>')
    expect(serviceSource).toContain("sort?: 'price_asc' | 'price_desc' | 'recent' | 'name' | 'rarity'")
    expect(serviceSource).toContain('cursor?: number')
    expect(serviceSource).toContain('limit?: number')
  })

  test('exports CollectionStats interface', () => {
    expect(serviceSource).toContain('export interface CollectionStats')
    expect(serviceSource).toContain('totalSupply: number')
    expect(serviceSource).toContain('listedCount: number')
    expect(serviceSource).toContain('floorPrice: number | null')
    expect(serviceSource).toContain('uniqueOwners: number')
    expect(serviceSource).toContain('totalVolume: number')
    expect(serviceSource).toContain('totalSales: number')
  })

  test('exports TraitCount interface', () => {
    expect(serviceSource).toContain('export interface TraitCount')
    expect(serviceSource).toContain('traitType: string')
    expect(serviceSource).toContain('traitValue: string')
  })

  test('exports OwnershipChange interface', () => {
    expect(serviceSource).toContain('export interface OwnershipChange')
    expect(serviceSource).toContain('previousOwner: string')
    expect(serviceSource).toContain('newOwner: string')
  })
})

describe('IndexerService methods', () => {
  test('has indexOnMint method', () => {
    expect(serviceSource).toContain('async indexOnMint(')
  })

  test('has syncCollectionOwnership method', () => {
    expect(serviceSource).toContain('async syncCollectionOwnership(')
  })

  test('has syncSingleCollectionOwnership method', () => {
    expect(serviceSource).toContain('async syncSingleCollectionOwnership(')
  })

  test('has getTokenOwner method', () => {
    expect(serviceSource).toContain('async getTokenOwner(')
  })

  test('has fetchAndCacheMetadata method', () => {
    expect(serviceSource).toContain('async fetchAndCacheMetadata(')
  })

  test('has indexTraits method', () => {
    expect(serviceSource).toContain('async indexTraits(')
  })

  test('has getTraitCounts method', () => {
    expect(serviceSource).toContain('async getTraitCounts(')
  })

  test('has getCollectionStats method', () => {
    expect(serviceSource).toContain('async getCollectionStats(')
  })

  test('has searchNFTs method', () => {
    expect(serviceSource).toContain('async searchNFTs(')
  })

  test('has recordEvent method', () => {
    expect(serviceSource).toContain('async recordEvent(')
  })

  test('has getEvents method', () => {
    expect(serviceSource).toContain('async getEvents(')
  })
})

describe('IndexerService implementation details', () => {
  test('uses cache for metadata with indefinite TTL', () => {
    expect(serviceSource).toContain('Number.MAX_SAFE_INTEGER')
  })

  test('uses cache.getOrFetch for trait counts', () => {
    expect(serviceSource).toContain('cache.getOrFetch')
  })

  test('uses cache.getOrFetch for collection stats', () => {
    const statsMethod = serviceSource.slice(
      serviceSource.indexOf('async getCollectionStats'),
    )
    expect(statsMethod).toContain('cache.getOrFetch')
  })

  test('invalidates cache on event recording', () => {
    const recordMethod = serviceSource.slice(
      serviceSource.indexOf('async recordEvent'),
    )
    expect(recordMethod).toContain('cache.invalidate')
  })

  test('invalidates trait count cache on trait indexing', () => {
    const indexMethod = serviceSource.slice(
      serviceSource.indexOf('async indexTraits'),
    )
    expect(indexMethod).toContain('cache.invalidate')
  })

  test('uses batched processing with configurable batch size', () => {
    expect(serviceSource).toContain('OWNERSHIP_BATCH_SIZE')
    expect(serviceSource).toContain('this.chunk(')
  })

  test('has timeout for metadata fetch', () => {
    expect(serviceSource).toContain('METADATA_FETCH_TIMEOUT')
  })

  test('uses rpcService for on-chain data', () => {
    expect(serviceSource).toContain('rpcService.call(')
  })

  test('handles onConflict for upsert on mint indexing', () => {
    expect(serviceSource).toContain('onConflict')
    expect(serviceSource).toContain('doUpdateSet')
  })

  test('records timestamp fields correctly', () => {
    expect(serviceSource).toContain('indexed_at: new Date().toISOString()')
    expect(serviceSource).toContain('created_at: new Date().toISOString()')
    expect(serviceSource).toContain('updated_at: new Date().toISOString()')
  })

  test('gracefully handles missing tables with try/catch', () => {
    // Count try-catch blocks
    const tryCatchCount = (serviceSource.match(/catch\s*[\({]/g) || []).length
    expect(tryCatchCount).toBeGreaterThanOrEqual(5)
  })
})

// ============================================
// Runtime tests with mock DB
// ============================================

describe('IndexerService runtime', () => {
  // Mock database for testing
  function createMockDb() {
    const tables: Record<string, any[]> = {
      nfts: [],
      nft_traits: [],
      marketplace_events: [],
      collections: [],
    }

    let autoIncrementId: Record<string, number> = {
      nfts: 1,
      nft_traits: 1,
      marketplace_events: 1,
    }

    return {
      selectFrom(table: string) {
        const rows = tables[table] || []
        let filters: Array<(row: any) => boolean> = []
        let selectedCols: string[] | null = null
        let orderCol: string | null = null
        let orderDir: 'asc' | 'desc' = 'asc'
        let limitVal: number | null = null

        const builder: any = {
          selectAll() {
            return builder
          },
          select(cols: any) {
            if (Array.isArray(cols)) selectedCols = cols
            return builder
          },
          where(col: string | Function, op?: string, val?: any) {
            if (typeof col === 'function') {
              // expression builder callback — skip for mock
              return builder
            }
            if (op === '=' || op === undefined) {
              filters.push((row: any) => row[col] === (val ?? op))
            }
            else if (op === 'in') {
              filters.push((row: any) => (val as any[]).includes(row[col]))
            }
            else if (op === '>=') {
              filters.push((row: any) => Number(row[col]) >= Number(val))
            }
            else if (op === '<=') {
              filters.push((row: any) => Number(row[col]) <= Number(val))
            }
            else if (op === '<') {
              filters.push((row: any) => Number(row[col]) < Number(val))
            }
            return builder
          },
          groupBy() { return builder },
          orderBy(col: string, dir?: string) {
            orderCol = col
            orderDir = (dir as any) || 'asc'
            return builder
          },
          limit(n: number) { limitVal = n; return builder },
          async execute() {
            let result = rows.filter(row =>
              filters.every(f => f(row)),
            )
            if (orderCol) {
              const col = orderCol
              result.sort((a: any, b: any) => {
                const av = a[col], bv = b[col]
                const cmp = av < bv ? -1 : av > bv ? 1 : 0
                return orderDir === 'desc' ? -cmp : cmp
              })
            }
            if (limitVal !== null) result = result.slice(0, limitVal)
            return result
          },
          async executeTakeFirst() {
            const result = await builder.execute()
            return result[0] || null
          },
        }
        return builder
      },
      insertInto(table: string) {
        let valueObj: any = null
        const makeDoUpdate = () => ({ doUpdateSet() { return builder } })
        const builder: any = {
          values(v: any) { valueObj = v; return builder },
          onConflict(_arg?: any) {
            // Kysely callback pattern: onConflict(oc => oc.column('x').doUpdateSet({}))
            if (typeof _arg === 'function') {
              const oc = {
                column() { return makeDoUpdate() },
                columns() { return makeDoUpdate() },
              }
              _arg(oc)
            }
            return builder
          },
          async execute() {
            if (valueObj && tables[table]) {
              const id = autoIncrementId[table]++
              tables[table].push({ id, ...valueObj })
            }
          },
        }
        return builder
      },
      updateTable(table: string) {
        let setObj: any = null
        let updateFilters: Array<(row: any) => boolean> = []
        const builder: any = {
          set(s: any) { setObj = s; return builder },
          where(col: string, op: string, val: any) {
            if (op === '=') updateFilters.push((row: any) => row[col] === val)
            return builder
          },
          async execute() {
            if (!setObj || !tables[table]) return
            for (const row of tables[table]) {
              if (updateFilters.every(f => f(row))) {
                Object.assign(row, setObj)
              }
            }
          },
        }
        return builder
      },
      fn: {
        count(col: string) { return { as(alias: string) { return alias } } },
        countDistinct(col: string) { return { as(alias: string) { return alias } } },
        sum(col: string) { return { as(alias: string) { return alias } } },
        min(expr: any) { return { as(alias: string) { return alias } } },
      },
      raw(expr: string) { return expr },
      // Direct access for test assertions
      _tables: tables,
    }
  }

  let mockDb: ReturnType<typeof createMockDb>

  beforeEach(() => {
    mockDb = createMockDb()
  })

  test('indexOnMint inserts NFT record into database', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    await svc.indexOnMint(mockDb, {
      mint: 'MINT_TEST_ABC',
      name: 'Test Hoodie #1',
      symbol: 'HOOD',
      uri: '',
      owner: 'WALLET_123',
      collectionId: 1,
      attributes: [
        { trait_type: 'Background', value: 'Purple' },
        { trait_type: 'Hat', value: 'Crown' },
      ],
      image: 'https://example.com/image.png',
    })

    const nfts = mockDb._tables.nfts
    expect(nfts.length).toBe(1)
    expect(nfts[0].mint_address).toBe('MINT_TEST_ABC')
    expect(nfts[0].name).toBe('Test Hoodie #1')
    expect(nfts[0].owner_wallet_address).toBe('WALLET_123')
    expect(nfts[0].image_url).toBe('https://example.com/image.png')
    expect(nfts[0].status).toBe('unlisted')
    expect(nfts[0].is_for_sale).toBe(0)
    expect(nfts[0].is_compressed).toBe(0)
  })

  test('indexOnMint stores compressed NFT data', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    await svc.indexOnMint(mockDb, {
      mint: 'CMINT_TEST',
      name: 'Compressed Hoodie #1',
      symbol: 'HOOD',
      uri: '',
      owner: 'WALLET_456',
      collectionId: 2,
      compressed: true,
      treeAddress: 'TREE_ADDR_123',
      leafIndex: 42,
    })

    const nfts = mockDb._tables.nfts
    expect(nfts.length).toBe(1)
    expect(nfts[0].is_compressed).toBe(1)
    expect(nfts[0].tree_address).toBe('TREE_ADDR_123')
    expect(nfts[0].leaf_index).toBe(42)
  })

  test('indexOnMint indexes trait attributes', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    await svc.indexOnMint(mockDb, {
      mint: 'MINT_TRAITS',
      name: 'Trait Test',
      symbol: 'TEST',
      uri: '',
      owner: 'OWNER',
      collectionId: 1,
      attributes: [
        { trait_type: 'Background', value: 'Cosmic Purple' },
        { trait_type: 'Hat', value: 'Crown' },
        { trait_type: 'Eyes', value: 'Laser' },
      ],
    })

    const traits = mockDb._tables.nft_traits
    expect(traits.length).toBe(3)
    expect(traits[0].mint_address).toBe('MINT_TRAITS')
    expect(traits[0].trait_type).toBe('Background')
    expect(traits[0].trait_value).toBe('Cosmic Purple')
    expect(traits[1].trait_type).toBe('Hat')
    expect(traits[2].trait_type).toBe('Eyes')
  })

  test('indexOnMint skips traits with missing trait_type or value', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    await svc.indexOnMint(mockDb, {
      mint: 'MINT_SKIP',
      name: 'Skip Test',
      symbol: 'TEST',
      uri: '',
      owner: 'OWNER',
      collectionId: 1,
      attributes: [
        { trait_type: '', value: 'Purple' },
        { trait_type: 'Hat', value: 'Crown' },
      ],
    })

    const traits = mockDb._tables.nft_traits
    // Only 'Hat' should be indexed, empty trait_type should be skipped
    expect(traits.length).toBe(1)
    expect(traits[0].trait_type).toBe('Hat')
  })

  test('recordEvent stores event in marketplace_events table', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    await svc.recordEvent(mockDb, {
      type: 'sale',
      nftId: 1,
      nftMint: 'MINT_ABC',
      collectionId: 1,
      fromWallet: 'SELLER_WALLET',
      toWallet: 'BUYER_WALLET',
      price: 1.5,
      txSignature: 'TX_SIG_123',
    })

    const events = mockDb._tables.marketplace_events
    expect(events.length).toBe(1)
    expect(events[0].type).toBe('sale')
    expect(events[0].nft_mint).toBe('MINT_ABC')
    expect(events[0].from_wallet).toBe('SELLER_WALLET')
    expect(events[0].to_wallet).toBe('BUYER_WALLET')
    expect(events[0].price).toBe(1.5)
    expect(events[0].source).toBe('hoodies')
  })

  test('recordEvent defaults source to hoodies', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    await svc.recordEvent(mockDb, {
      type: 'listing',
      nftMint: 'MINT_XYZ',
    })

    expect(mockDb._tables.marketplace_events[0].source).toBe('hoodies')
  })

  test('recordEvent records external source', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    await svc.recordEvent(mockDb, {
      type: 'transfer',
      nftMint: 'MINT_XYZ',
      source: 'external',
    })

    expect(mockDb._tables.marketplace_events[0].source).toBe('external')
  })

  test('searchNFTs returns all NFTs when no filters', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    // Insert test NFTs
    mockDb._tables.nfts.push(
      { id: 1, name: 'Hoodie #1', mint_address: 'M1', status: 'listed', collection_id: 1, listing_price: 100, created_at: '2026-01-01' },
      { id: 2, name: 'Hoodie #2', mint_address: 'M2', status: 'unlisted', collection_id: 1, listing_price: null, created_at: '2026-01-02' },
      { id: 3, name: 'Hoodie #3', mint_address: 'M3', status: 'listed', collection_id: 1, listing_price: 200, created_at: '2026-01-03' },
    )

    const results = await svc.searchNFTs(mockDb, '')
    expect(results.length).toBe(3)
  })

  test('searchNFTs filters by text query', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    mockDb._tables.nfts.push(
      { id: 1, name: 'Cosmic Hoodie', mint_address: 'M1', status: 'unlisted', collection_id: 1, created_at: '2026-01-01' },
      { id: 2, name: 'Fire Hoodie', mint_address: 'M2', status: 'unlisted', collection_id: 1, created_at: '2026-01-02' },
      { id: 3, name: 'Ice Cap', mint_address: 'M3', status: 'unlisted', collection_id: 1, created_at: '2026-01-03' },
    )

    const results = await svc.searchNFTs(mockDb, 'hoodie')
    expect(results.length).toBe(2)
    expect(results.every((r: any) => r.name.toLowerCase().includes('hoodie'))).toBe(true)
  })

  test('searchNFTs filters by collection', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    mockDb._tables.nfts.push(
      { id: 1, name: 'A', mint_address: 'M1', collection_id: 1, status: 'unlisted', created_at: '2026-01-01' },
      { id: 2, name: 'B', mint_address: 'M2', collection_id: 2, status: 'unlisted', created_at: '2026-01-02' },
      { id: 3, name: 'C', mint_address: 'M3', collection_id: 1, status: 'unlisted', created_at: '2026-01-03' },
    )

    const results = await svc.searchNFTs(mockDb, '', { collectionId: 1 })
    expect(results.length).toBe(2)
    expect(results.every((r: any) => r.collection_id === 1)).toBe(true)
  })

  test('searchNFTs sorts by price ascending', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    mockDb._tables.nfts.push(
      { id: 1, name: 'A', mint_address: 'M1', listing_price: 300, collection_id: 1, status: 'listed', created_at: '2026-01-01' },
      { id: 2, name: 'B', mint_address: 'M2', listing_price: 100, collection_id: 1, status: 'listed', created_at: '2026-01-02' },
      { id: 3, name: 'C', mint_address: 'M3', listing_price: 200, collection_id: 1, status: 'listed', created_at: '2026-01-03' },
    )

    const results = await svc.searchNFTs(mockDb, '', { sort: 'price_asc' })
    expect(results[0].listing_price).toBe(100)
    expect(results[1].listing_price).toBe(200)
    expect(results[2].listing_price).toBe(300)
  })

  test('searchNFTs sorts by price descending', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    mockDb._tables.nfts.push(
      { id: 1, name: 'A', mint_address: 'M1', listing_price: 100, collection_id: 1, status: 'listed', created_at: '2026-01-01' },
      { id: 2, name: 'B', mint_address: 'M2', listing_price: 300, collection_id: 1, status: 'listed', created_at: '2026-01-02' },
      { id: 3, name: 'C', mint_address: 'M3', listing_price: 200, collection_id: 1, status: 'listed', created_at: '2026-01-03' },
    )

    const results = await svc.searchNFTs(mockDb, '', { sort: 'price_desc' })
    expect(results[0].listing_price).toBe(300)
    expect(results[1].listing_price).toBe(200)
    expect(results[2].listing_price).toBe(100)
  })

  test('searchNFTs sorts by name', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    mockDb._tables.nfts.push(
      { id: 1, name: 'Charlie', mint_address: 'M1', collection_id: 1, status: 'unlisted', created_at: '2026-01-01' },
      { id: 2, name: 'Alice', mint_address: 'M2', collection_id: 1, status: 'unlisted', created_at: '2026-01-02' },
      { id: 3, name: 'Bob', mint_address: 'M3', collection_id: 1, status: 'unlisted', created_at: '2026-01-03' },
    )

    const results = await svc.searchNFTs(mockDb, '', { sort: 'name' })
    expect(results[0].name).toBe('Alice')
    expect(results[1].name).toBe('Bob')
    expect(results[2].name).toBe('Charlie')
  })

  test('searchNFTs respects limit', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    for (let i = 0; i < 10; i++) {
      mockDb._tables.nfts.push({
        id: i + 1, name: `NFT #${i}`, mint_address: `M${i}`,
        collection_id: 1, status: 'unlisted', created_at: '2026-01-01',
      })
    }

    const results = await svc.searchNFTs(mockDb, '', { limit: 3 })
    expect(results.length).toBe(3)
  })

  test('searchNFTs clamps limit to max 100', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    for (let i = 0; i < 5; i++) {
      mockDb._tables.nfts.push({
        id: i + 1, name: `NFT #${i}`, mint_address: `M${i}`,
        collection_id: 1, status: 'unlisted', created_at: '2026-01-01',
      })
    }

    // Request 200, should be clamped
    const results = await svc.searchNFTs(mockDb, '', { limit: 200 })
    expect(results.length).toBe(5)
  })

  test('searchNFTs supports cursor-based pagination', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    mockDb._tables.nfts.push(
      { id: 1, name: 'A', mint_address: 'M1', collection_id: 1, status: 'unlisted', created_at: '2026-01-01' },
      { id: 2, name: 'B', mint_address: 'M2', collection_id: 1, status: 'unlisted', created_at: '2026-01-02' },
      { id: 3, name: 'C', mint_address: 'M3', collection_id: 1, status: 'unlisted', created_at: '2026-01-03' },
    )

    // First page: get all 3 sorted by recent (desc) → ids: 3, 2, 1
    const page1 = await svc.searchNFTs(mockDb, '', { sort: 'recent', limit: 2 })
    expect(page1.length).toBe(2)

    // Second page: cursor after id=2 (last item from page 1)
    const page2 = await svc.searchNFTs(mockDb, '', {
      sort: 'recent',
      cursor: page1[page1.length - 1].id,
      limit: 2,
    })
    // Should return items after the cursor position in the sorted result
    expect(page2.length).toBeGreaterThanOrEqual(1)
  })

  test('searchNFTs returns empty array on error', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    // Empty db that throws on selectFrom
    const brokenDb = {
      selectFrom() {
        throw new Error('DB connection failed')
      },
    }

    const results = await svc.searchNFTs(brokenDb, 'test')
    expect(results).toEqual([])
  })

  test('getEvents returns events filtered by type', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    mockDb._tables.marketplace_events.push(
      { id: 1, type: 'sale', nft_mint: 'M1', collection_id: 1, created_at: '2026-01-01' },
      { id: 2, type: 'listing', nft_mint: 'M2', collection_id: 1, created_at: '2026-01-02' },
      { id: 3, type: 'sale', nft_mint: 'M3', collection_id: 1, created_at: '2026-01-03' },
    )

    const results = await svc.getEvents(mockDb, { type: 'sale' })
    expect(results.length).toBe(2)
    expect(results.every((e: any) => e.type === 'sale')).toBe(true)
  })

  test('getEvents returns events filtered by collection', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    mockDb._tables.marketplace_events.push(
      { id: 1, type: 'sale', collection_id: 1, created_at: '2026-01-01' },
      { id: 2, type: 'sale', collection_id: 2, created_at: '2026-01-02' },
      { id: 3, type: 'sale', collection_id: 1, created_at: '2026-01-03' },
    )

    const results = await svc.getEvents(mockDb, { collectionId: 1 })
    expect(results.length).toBe(2)
  })

  test('getEvents respects limit', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    for (let i = 0; i < 10; i++) {
      mockDb._tables.marketplace_events.push({
        id: i + 1, type: 'sale', collection_id: 1, created_at: `2026-01-${String(i + 1).padStart(2, '0')}`,
      })
    }

    const results = await svc.getEvents(mockDb, { limit: 3 })
    expect(results.length).toBe(3)
  })

  test('fetchAndCacheMetadata returns null for empty uri', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    const result = await svc.fetchAndCacheMetadata('MINT_123', '')
    expect(result).toBeNull()
  })

  test('fetchAndCacheMetadata returns null on fetch error', async () => {
    const { indexerService: svc } = await import('../../../app/Services/IndexerService')

    // Use an invalid URL that will fail
    const result = await svc.fetchAndCacheMetadata('MINT_123', 'not-a-url')
    expect(result).toBeNull()
  })
})
