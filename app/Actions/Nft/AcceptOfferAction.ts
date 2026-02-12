import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Accept Offer',
  description: 'Build an unsigned accept-offer transaction for client wallet signing',
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
      const unsignedTx = await tokenService.buildAcceptOfferTransaction(offerId, sellerWalletAddress)

      return response.json({
        success: true,
        transaction: {
          serializedTransaction: unsignedTx.serializedTransaction,
          message: unsignedTx.message,
        },
        offer: {
          id: offerId,
          amount: offer.amount,
          buyerWalletAddress: offer.buyer_wallet_address,
        },
        nft: {
          id: nft.id,
          name: nft.name,
          mintAddress: nft.mint_address,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to build accept offer transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
