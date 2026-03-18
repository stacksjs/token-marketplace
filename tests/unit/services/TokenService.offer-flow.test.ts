/**
 * TokenService Offer Flow Tests
 *
 * Tests make → accept/cancel offer flows in mock mode.
 */
import { describe, expect, test } from 'bun:test'

process.env.TOKENS_MOCK_MODE = 'true'

import { TokenService } from '../../../app/Services/TokenService'

describe('TokenService Offer Flows', () => {
  describe('Make offer', () => {
    test('creates offer with active status', async () => {
      const service = new TokenService()
      const offer = await service.makeOffer('mintAddr1', BigInt(1_500_000_000))
      expect(offer.status).toBe('active')
      expect(offer.id).toBeDefined()
    })

    test('offer amount is stored correctly', async () => {
      const service = new TokenService()
      const offer = await service.makeOffer('mintAddr2', BigInt(2_500_000_000))
      expect(offer.amount).toBe(BigInt(2_500_000_000))
    })
  })

  describe('Accept offer', () => {
    test('accepting offer returns signature and updated status', async () => {
      const service = new TokenService()
      const offer = await service.makeOffer('mintAddr3', BigInt(1_000_000_000))
      const acceptance = await service.acceptOffer(offer.id)
      expect(acceptance.signature).toBeDefined()
      expect(acceptance.signature.length).toBe(88)
      expect(acceptance.offer.status).toBe('accepted')
    })
  })

  describe('Cancel offer', () => {
    test('cancelling offer returns refund signature', async () => {
      const service = new TokenService()
      const offer = await service.makeOffer('mintAddr4', BigInt(500_000_000))
      const cancellation = await service.cancelOffer(offer.id)
      expect(cancellation.signature).toBeDefined()
      expect(cancellation.offer.status).toBe('cancelled')
    })
  })

  describe('Multiple offers on same NFT', () => {
    test('can place multiple offers on same mint', async () => {
      const service = new TokenService()
      const o1 = await service.makeOffer('sameMint', BigInt(1_000_000_000))
      const o2 = await service.makeOffer('sameMint', BigInt(1_500_000_000))
      expect(o1.id).not.toBe(o2.id)
      expect(o1.status).toBe('active')
      expect(o2.status).toBe('active')
    })
  })
})
