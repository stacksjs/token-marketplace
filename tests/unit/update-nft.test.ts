import { describe, expect, test, beforeAll } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: UpdateNftMetadataAction
// ============================================

const actionPath = 'app/Actions/Nft/UpdateNftMetadataAction.ts'
const actionSource = readFileSync(actionPath, 'utf-8')

describe('UpdateNftMetadataAction structure', () => {
  test('file exists', () => {
    expect(existsSync(actionPath)).toBe(true)
  })

  test('imports Action from @stacksjs/actions', () => {
    expect(actionSource).toContain("from '@stacksjs/actions'")
  })

  test('imports getTokenService', () => {
    expect(actionSource).toContain('getTokenService')
  })

  test('validates nftId and walletAddress required', () => {
    expect(actionSource).toContain('nftId')
    expect(actionSource).toContain('walletAddress')
  })

  test('requires at least one update field', () => {
    expect(actionSource).toContain('At least one field')
  })

  test('verifies ownership', () => {
    expect(actionSource).toContain('owner_wallet_address')
  })

  test('calls buildUpdateNFTTransaction', () => {
    expect(actionSource).toContain('buildUpdateNFTTransaction')
  })
})

// ============================================
// Static analysis: TokenService update method
// ============================================

const servicePath = 'app/Services/TokenService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('TokenService buildUpdateNFTTransaction', () => {
  test('has buildUpdateNFTTransaction method', () => {
    expect(serviceSource).toContain('buildUpdateNFTTransaction')
  })

  test('accepts mint and optional fields', () => {
    expect(serviceSource).toContain('mint:')
  })
})

// ============================================
// ConfirmTransactionAction supports update_nft
// ============================================

const confirmPath = 'app/Actions/Nft/ConfirmTransactionAction.ts'
const confirmSource = readFileSync(confirmPath, 'utf-8')

describe('ConfirmTransactionAction update_nft support', () => {
  test('includes update_nft in type union', () => {
    expect(confirmSource).toContain('update_nft')
  })

  test('has handleUpdateNFT function', () => {
    expect(confirmSource).toContain('handleUpdateNFT')
  })
})

// ============================================
// Route exists
// ============================================

const routesPath = 'routes/api.ts'
const routesSource = readFileSync(routesPath, 'utf-8')

describe('Update NFT route', () => {
  test('has update NFT route', () => {
    expect(routesSource).toContain('UpdateNftMetadataAction')
  })
})

// ============================================
// Mock mode runtime test
// ============================================

describe('TokenService mock buildUpdateNFTTransaction', () => {
  let getTokenService: any

  beforeAll(async () => {
    process.env.TOKENS_MOCK_MODE = 'true'
    const mod = await import('../../app/Services/TokenService')
    getTokenService = mod.getTokenService
  })

  test('returns unsigned transaction in mock mode', async () => {
    const svc = getTokenService()
    const result = await svc.buildUpdateNFTTransaction({
      mint: 'FakeMint12345678901234567890123456789012',
      name: 'Updated Name',
      ownerAddress: 'FakeOwner12345678901234567890123456789012',
    })
    expect(result.serializedTransaction).toBeDefined()
    expect(result.message).toContain('Update NFT')
  })
})
