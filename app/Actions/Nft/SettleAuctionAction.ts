import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Settle Auction',
  description: 'Settle a completed auction and transfer the NFT',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { auctionId } = body

    if (!auctionId) {
      return response.json({
        error: 'auctionId is required',
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

    // Auctions can be settled when 'ended' (time expired) or 'active' (seller ends early)
    const settlableStatuses = ['active', 'ended']
    if (!settlableStatuses.includes(auction.status as string)) {
      return response.json({
        error: `Cannot settle auction with status: ${auction.status}. Must be 'active' or 'ended'.`,
      }, 400)
    }

    // If auction has an end time and it hasn't passed, only allow if status is already 'ended'
    if (auction.status === 'active' && (auction as any).ends_at) {
      const endsAt = new Date((auction as any).ends_at)
      if (endsAt > new Date()) {
        return response.json({
          error: 'Auction is still active and has not reached its end time',
        }, 400)
      }
    }

    if (!auction.highest_bidder_wallet) {
      return response.json({
        error: 'No bids placed on this auction',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const result = await tokenService.settleAuction(auctionId)

      // Atomically update auction, transfer NFT, and mark winning bid
      await db.transaction().execute(async (trx) => {
        // Update auction
        await trx
          .updateTable('auctions')
          .set({
            status: 'settled',
            settlement_signature: result.signature,
            updated_at: new Date().toISOString(),
          })
          .where('id', '=', auction.id)
          .execute()

        // Transfer NFT ownership in database
        if (auction.nft_id) {
          await trx
            .updateTable('nfts')
            .set({
              owner_wallet_address: auction.highest_bidder_wallet,
              is_for_sale: 0,
              updated_at: new Date().toISOString(),
            })
            .where('id', '=', Number(auction.nft_id))
            .execute()
        }

        // Update winning bid status
        await trx
          .updateTable('bids')
          .set({
            status: 'won',
          })
          .where('auction_id', '=', auction.id)
          .where('bidder_wallet_address', '=', auction.highest_bidder_wallet)
          .where('amount', '=', auction.current_bid)
          .execute()
      })

      return response.json({
        success: true,
        transaction: {
          signature: result.signature,
        },
        auction: {
          id: auctionId,
          status: 'settled',
          winner: auction.highest_bidder_wallet,
          winningBid: auction.current_bid,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to settle auction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
