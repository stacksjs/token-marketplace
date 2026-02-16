import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Place Bid',
  description: 'Place a bid on an NFT auction',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { auctionId, amount, bidderWalletAddress } = body

    if (!auctionId || !amount || !bidderWalletAddress) {
      return response.json({
        error: 'auctionId, amount, and bidderWalletAddress are required',
      }, 400)
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return response.json({
        error: 'amount must be a positive number',
      }, 400)
    }

    // Get auction from database
    const auction = await db
      .selectFrom('auctions')
      .selectAll()
      .where('uuid', '=', auctionId)
      .executeTakeFirst()

    if (!auction) {
      return response.notFound({ error: 'Auction not found' })
    }

    if (auction.status !== 'active') {
      return response.json({
        error: `Cannot bid on auction with status: ${auction.status}`,
      }, 400)
    }

    if (auction.seller_wallet_address === bidderWalletAddress) {
      return response.json({
        error: 'Cannot bid on your own auction',
      }, 400)
    }

    const amountLamports = BigInt(Math.floor(amount * 1e9))

    try {
      const tokenService = getTokenService()
      const bidResult = await tokenService.placeBid(auctionId, amountLamports)

      // Use a transaction to atomically check bid + insert + update
      const result = await db.transaction().execute(async (trx) => {
        // Re-read auction inside transaction for atomicity
        const currentAuction = await trx
          .selectFrom('auctions')
          .select(['id', 'current_bid'])
          .where('uuid', '=', auctionId)
          .executeTakeFirst()

        if (!currentAuction) {
          throw new Error('Auction not found')
        }

        // Check if bid is higher than current highest (inside transaction)
        if (currentAuction.current_bid && Number(amountLamports) <= currentAuction.current_bid) {
          throw new Error('Bid must be higher than current highest bid')
        }

        // Store bid in database
        await trx
          .insertInto('bids')
          .values({
            uuid: `bid_${Date.now().toString(36)}`,
            auction_id: currentAuction.id,
            bidder_wallet_address: bidderWalletAddress,
            amount: Number(amountLamports),
            status: 'confirmed',
            created_at: new Date().toISOString(),
          })
          .execute()

        // Update auction with highest bid
        await trx
          .updateTable('auctions')
          .set({
            current_bid: Number(amountLamports),
            highest_bidder_wallet: bidderWalletAddress,
            updated_at: new Date().toISOString(),
          })
          .where('id', '=', currentAuction.id)
          .execute()

        return { success: true }
      })

      return response.json({
        success: true,
        bid: {
          auctionId,
          amount,
          amountLamports: amountLamports.toString(),
          bidderWalletAddress,
          status: 'confirmed',
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message === 'Bid must be higher than current highest bid') {
        return response.json({ error: message }, 400)
      }
      return response.json({
        error: 'Failed to place bid',
        details: message,
      }, 500)
    }
  },
})
