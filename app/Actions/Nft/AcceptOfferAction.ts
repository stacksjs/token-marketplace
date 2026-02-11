import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Accept Offer',
  description: 'Accept an offer on an NFT',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { offerId, sellerWalletAddress } = body

    if (!offerId || !sellerWalletAddress) {
      return response.json({
        error: 'offerId and sellerWalletAddress are required',
      }, 400)
    }

    // Get offer from database
    const offer = await db
      .selectFrom('offers')
      .selectAll()
      .where('uuid', '=', offerId)
      .executeTakeFirst()

    if (!offer) {
      return response.notFound({ error: 'Offer not found' })
    }

    if (offer.status !== 'pending') {
      return response.json({
        error: `Cannot accept offer with status: ${offer.status}`,
      }, 400)
    }

    // Verify seller owns the NFT
    const nft = await db
      .selectFrom('nfts')
      .selectAll()
      .where('id', '=', Number(offer.nft_id))
      .executeTakeFirst()

    if (!nft || nft.owner_wallet_address !== sellerWalletAddress) {
      return response.json({
        error: 'Only the NFT owner can accept offers',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const result = await tokenService.acceptOffer(offerId)

      // Update offer status
      await db
        .updateTable('offers')
        .set({
          status: 'accepted',
          transaction_signature: result.signature,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', offer.id)
        .execute()

      // Transfer NFT ownership in database
      await db
        .updateTable('nfts')
        .set({
          owner_wallet_address: offer.buyer_wallet_address,
          is_for_sale: 0,
          listing_id: null,
          delegate_address: null,
          listed_at: null,
          listing_price: null,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', Number(offer.nft_id))
        .execute()

      return response.json({
        success: true,
        transaction: {
          signature: result.signature,
        },
        offer: {
          id: offerId,
          status: 'accepted',
          amount: offer.amount,
          buyerWalletAddress: offer.buyer_wallet_address,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to accept offer',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
