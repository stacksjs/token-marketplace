import { describe, expect, test, beforeAll } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: QuickMintAction
// ============================================

const actionPath = 'app/Actions/Mint/QuickMintAction.ts'
const actionSource = readFileSync(actionPath, 'utf-8')

describe('QuickMintAction structure', () => {
  test('file exists', () => {
    expect(existsSync(actionPath)).toBe(true)
  })

  test('imports Action from @stacksjs/actions', () => {
    expect(actionSource).toContain("from '@stacksjs/actions'")
  })

  test('imports getTokenService', () => {
    expect(actionSource).toContain('getTokenService')
  })

  test('validates name and walletAddress', () => {
    expect(actionSource).toContain('name')
    expect(actionSource).toContain('walletAddress')
  })

  test('calls buildQuickMintTransaction', () => {
    expect(actionSource).toContain('buildQuickMintTransaction')
  })

  test('returns serialized transaction', () => {
    expect(actionSource).toContain('serializedTransaction')
  })

  test('optionally resolves collectionId', () => {
    expect(actionSource).toContain('collectionId')
    expect(actionSource).toContain('collections')
  })
})

// ============================================
// Static analysis: TokenService quick mint method
// ============================================

const servicePath = 'app/Services/TokenService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('TokenService buildQuickMintTransaction', () => {
  test('has buildQuickMintTransaction method', () => {
    expect(serviceSource).toContain('buildQuickMintTransaction')
  })

  test('accepts name and ownerAddress', () => {
    expect(serviceSource).toContain('ownerAddress')
  })

  test('returns UnsignedTransaction', () => {
    expect(serviceSource).toContain('UnsignedTransaction')
  })
})

// ============================================
// ConfirmTransactionAction supports quick_mint
// ============================================

const confirmPath = 'app/Actions/Nft/ConfirmTransactionAction.ts'
const confirmSource = readFileSync(confirmPath, 'utf-8')

describe('ConfirmTransactionAction quick_mint support', () => {
  test('includes quick_mint in type union', () => {
    expect(confirmSource).toContain('quick_mint')
  })

  test('has handleQuickMint function', () => {
    expect(confirmSource).toContain('handleQuickMint')
  })
})

// ============================================
// Route exists
// ============================================

const routesPath = 'routes/api.ts'
const routesSource = readFileSync(routesPath, 'utf-8')

describe('Quick mint route', () => {
  test('has quick mint route', () => {
    expect(routesSource).toContain('QuickMintAction')
  })
})

// ============================================
// Mock mode runtime test
// ============================================

describe('TokenService mock buildQuickMintTransaction', () => {
  let getTokenService: any

  beforeAll(async () => {
    process.env.TOKENS_MOCK_MODE = 'true'
    const mod = await import('../../app/Services/TokenService')
    getTokenService = mod.getTokenService
  })

  test('returns unsigned transaction in mock mode', async () => {
    const svc = getTokenService()
    const result = await svc.buildQuickMintTransaction({
      name: 'Test NFT',
      ownerAddress: 'FakeOwner12345678901234567890123456789012',
    })
    expect(result.serializedTransaction).toBeDefined()
    expect(result.message).toContain('Test NFT')
  })
})
