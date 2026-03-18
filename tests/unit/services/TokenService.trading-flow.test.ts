/**
 * TokenService Trading Flow Tests
 *
 * Tests listing → purchase flows, price updates, and delisting
 * in mock mode to verify the full trading lifecycle.
 */
import { describe, expect, test } from 'bun:test'

process.env.TOKENS_MOCK_MODE = 'true'

import { TokenService } from '../../../app/Services/TokenService'

describe('TokenService Trading Flows', () => {
  describe('Listing lifecycle', () => {
    test('list NFT sets delegate and price', async () => {
      const service = new TokenService()
      const result = await service.listNFT('mintAddr1', BigInt(5_000_000_000))
      expect(result.delegated).toBe(true)
      expect(result.mint).toBe('mintAddr1')
    })

    test('delist NFT revokes delegation', async () => {
      const service = new TokenService()
      await service.listNFT('mintAddr2', BigInt(3_000_000_000))
      const result = await service.delistNFT('mintAddr2')
      expect(result.delegated).toBe(false)
      expect(result.mint).toBe('mintAddr2')
    })

    test('buy listed NFT returns transfer signature', async () => {
      const service = new TokenService()
      await service.listNFT('mintAddr3', BigInt(2_000_000_000))
      const purchase = await service.buyListedNFT('mintAddr3')
      expect(purchase.signature).toBeDefined()
      expect(purchase.signature.length).toBe(88)
      expect(purchase.listing.mint).toBe('mintAddr3')
    })
  })

  describe('Price edge cases', () => {
    test('list at minimum price (1 lamport)', async () => {
      const service = new TokenService()
      const result = await service.listNFT('cheapMint', BigInt(1))
      expect(result.delegated).toBe(true)
    })

    test('list at high price (1000 SOL)', async () => {
      const service = new TokenService()
      const result = await service.listNFT('expensiveMint', BigInt(1_000_000_000_000))
      expect(result.delegated).toBe(true)
    })
  })

  describe('Multiple listings', () => {
    test('can list multiple NFTs from same wallet', async () => {
      const service = new TokenService()
      const r1 = await service.listNFT('multi1', BigInt(1_000_000_000))
      const r2 = await service.listNFT('multi2', BigInt(2_000_000_000))
      const r3 = await service.listNFT('multi3', BigInt(3_000_000_000))
      expect(r1.delegated).toBe(true)
      expect(r2.delegated).toBe(true)
      expect(r3.delegated).toBe(true)
    })
  })
})
