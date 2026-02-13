import { describe, expect, test, beforeAll } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: BulkCreateNftsAction
// ============================================

const actionPath = 'app/Actions/Nft/BulkCreateNftsAction.ts'
const actionSource = readFileSync(actionPath, 'utf-8')

describe('BulkCreateNftsAction structure', () => {
  test('file exists', () => {
    expect(existsSync(actionPath)).toBe(true)
  })

  test('imports Action from @stacksjs/actions', () => {
    expect(actionSource).toContain("from '@stacksjs/actions'")
  })

  test('imports getTokenService', () => {
    expect(actionSource).toContain('getTokenService')
  })

  test('validates items array', () => {
    expect(actionSource).toContain('items')
    expect(actionSource).toContain('Array.isArray')
  })

  test('enforces max 100 items', () => {
    expect(actionSource).toContain('100')
  })

  test('validates each item has name and uri', () => {
    expect(actionSource).toContain('name')
    expect(actionSource).toContain('uri')
  })

  test('calls batchCreateNFTs', () => {
    expect(actionSource).toContain('batchCreateNFTs')
  })

  test('returns created and failed counts', () => {
    expect(actionSource).toContain('created')
    expect(actionSource).toContain('failed')
  })
})

// ============================================
// Static analysis: TokenService batch method
// ============================================

const servicePath = 'app/Services/TokenService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('TokenService batchCreateNFTs', () => {
  test('has batchCreateNFTs method', () => {
    expect(serviceSource).toContain('batchCreateNFTs')
  })

  test('accepts progress callback', () => {
    expect(serviceSource).toContain('onProgress')
  })
})

// ============================================
// Route exists
// ============================================

const routesPath = 'routes/api.ts'
const routesSource = readFileSync(routesPath, 'utf-8')

describe('Bulk create route', () => {
  test('has bulk create route', () => {
    expect(routesSource).toContain('BulkCreateNftsAction')
  })
})

// ============================================
// Mock mode runtime test
// ============================================

describe('TokenService mock batchCreateNFTs', () => {
  let getTokenService: any

  beforeAll(async () => {
    process.env.TOKENS_MOCK_MODE = 'true'
    const mod = await import('../../app/Services/TokenService')
    getTokenService = mod.getTokenService
  })

  test('returns results for each item in mock mode', async () => {
    const svc = getTokenService()
    const items = [
      { name: 'NFT #1', uri: 'https://example.com/1' },
      { name: 'NFT #2', uri: 'https://example.com/2' },
      { name: 'NFT #3', uri: 'https://example.com/3' },
    ]
    const results = await svc.batchCreateNFTs(items, {})
    expect(results.length).toBe(3)
    for (const r of results) {
      expect(r.success).toBe(true)
      expect(r.mint).toBeDefined()
      expect(r.signature).toBeDefined()
    }
  })
})
