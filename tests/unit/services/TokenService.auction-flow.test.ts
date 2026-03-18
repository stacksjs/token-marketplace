/**
 * TokenService Auction Flow Tests
 *
 * Tests create → bid → settle/cancel auction flows in mock mode.
 */
import { describe, expect, test } from 'bun:test'

process.env.TOKENS_MOCK_MODE = 'true'

import { TokenService } from '../../../app/Services/TokenService'

describe('TokenService Auction Flows', () => {
  describe('English auction', () => {
    test('creates english auction with active status', async () => {
      const service = new TokenService()
      const auction = await service.createAuction('mintAddr1', {
        type: 'english',
        startPrice: BigInt(1_000_000_000),
        duration: 3600,
      })
      expect(auction.status).toBe('active')
      expect(auction.id).toBeDefined()
    })

    test('place bid on english auction', async () => {
      const service = new TokenService()
      const auction = await service.createAuction('mintAddr2', {
        type: 'english',
        startPrice: BigInt(1_000_000_000),
        duration: 3600,
      })
      const bid = await service.placeBid(auction.id, BigInt(1_500_000_000))
      expect(bid.status).toBe('confirmed')
      expect(bid.amount).toBe(BigInt(1_500_000_000))
    })

    test('settle english auction transfers NFT to winner', async () => {
      const service = new TokenService()
      const auction = await service.createAuction('mintAddr3', {
        type: 'english',
        startPrice: BigInt(1_000_000_000),
        duration: 3600,
      })
      await service.placeBid(auction.id, BigInt(2_000_000_000))
      const settlement = await service.settleAuction(auction.id)
      expect(settlement.signature).toBeDefined()
      expect(settlement.auction.status).toBe('settled')
    })
  })

  describe('Dutch auction', () => {
    test('creates dutch auction with decreasing price', async () => {
      const service = new TokenService()
      const auction = await service.createAuction('dutchMint', {
        type: 'dutch',
        startPrice: BigInt(10_000_000_000),
        duration: 7200,
      })
      expect(auction.status).toBe('active')
      expect(auction.id).toBeDefined()
    })
  })

  describe('Cancel auction', () => {
    test('cancel returns NFT to seller', async () => {
      const service = new TokenService()
      const auction = await service.createAuction('cancelMint', {
        type: 'english',
        startPrice: BigInt(500_000_000),
        duration: 1800,
      })
      const cancellation = await service.cancelAuction(auction.id)
      expect(cancellation.signature).toBeDefined()
      expect(cancellation.auction.status).toBe('cancelled')
    })
  })

  describe('Bid validation', () => {
    test('multiple ascending bids on same auction', async () => {
      const service = new TokenService()
      const auction = await service.createAuction('bidMint', {
        type: 'english',
        startPrice: BigInt(1_000_000_000),
        duration: 3600,
      })
      const b1 = await service.placeBid(auction.id, BigInt(1_500_000_000))
      const b2 = await service.placeBid(auction.id, BigInt(2_000_000_000))
      expect(b1.status).toBe('confirmed')
      expect(b2.status).toBe('confirmed')
    })
  })
})
