import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Cancel Auction',
  description: 'Cancel an active auction',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()
    const { auctionId, sellerWalletAddress } = body

    if (!auctionId || !sellerWalletAddress) {
      return response.json({
        error: 'auctionId and sellerWalletAddress are required',
      }, 400)
    }

    // Find the auction
    const auction = await db
      .selectFrom('auctions')
      .selectAll()
      .where('uuid', '=', auctionId)
      .executeTakeFirst()

    if (!auction) {
      return response.notFound({ error: 'Auction not found' })
    }

    if ((auction as any).status !== 'active') {
      return response.json({
        error: 'Only active auctions can be cancelled',
      }, 400)
    }

    if ((auction as any).seller_wallet_address !== sellerWalletAddress) {
      return response.json({
        error: 'Only the auction seller can cancel it',
      }, 400)
    }

    // Check for existing bids on English auctions
    if ((auction as any).auction_type === 'english') {
      try {
        const bids = await db
          .selectFrom('bids')
          .selectAll()
          .where('auction_id', '=', auction.id)
          .execute()
        if (bids.length > 0) {
          return response.json({
            error: 'Cannot cancel an English auction that already has bids',
          }, 400)
        }
      } catch (_) {
        // bids table may not exist yet
      }
    }

    try {
      const tokenService = getTokenService()
      const transaction = await tokenService.buildCancelAuctionTransaction(auctionId, sellerWalletAddress)

      // Update auction status in DB
      await db
        .updateTable('auctions')
        .set({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .where('uuid', '=', auctionId)
        .execute()

      return response.json({
        success: true,
        transaction: {
          serializedTransaction: transaction.serializedTransaction,
          message: transaction.message,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to cancel auction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
