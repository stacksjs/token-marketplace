import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Cancel Offer',
  description: 'Cancel a pending offer on an NFT',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { offerId, buyerWalletAddress } = body

    if (!offerId || !buyerWalletAddress) {
      return response.json({
        error: 'offerId and buyerWalletAddress are required',
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
        error: `Cannot cancel offer with status: ${offer.status}`,
      }, 400)
    }

    if (offer.buyer_wallet_address !== buyerWalletAddress) {
      return response.json({
        error: 'Only the offer maker can cancel the offer',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const result = await tokenService.cancelOffer(offerId)

      // Update offer status
      await db
        .updateTable('offers')
        .set({
          status: 'cancelled',
          transaction_signature: result.signature,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', offer.id)
        .execute()

      return response.json({
        success: true,
        transaction: {
          signature: result.signature,
          status: result.status,
        },
        offer: {
          id: offerId,
          status: 'cancelled',
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to cancel offer',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
