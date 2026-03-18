import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Auction Detail',
  description: 'Fetch auction details with bid history',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = Number(request.getParam('id'))

    let auction: any = null
    try {
      auction = await db
        .selectFrom('auctions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()
    }
    catch {
      return response.notFound({ error: 'Auction not found' })
    }

    if (!auction) {
      return response.notFound({ error: 'Auction not found' })
    }

    // Fetch NFT
    const nft = await db
      .selectFrom('nfts')
      .selectAll()
      .where('id', '=', auction.nft_id)
      .executeTakeFirst()

    // Fetch bids
    let bids: any[] = []
    try {
      bids = await db
        .selectFrom('bids')
        .selectAll()
        .where('auction_id', '=', id)
        .execute()

      bids = bids
        .map((b: any) => ({
          id: b.id,
          bidder: b.bidder_wallet_address || b.bidder_wallet,
          amount: Number(b.amount || 0) / 1e9,
          timestamp: b.created_at,
          txSignature: b.transaction_signature || null,
        }))
        .sort((a: any, b: any) => b.amount - a.amount)
    }
    catch {
      // bids table may not exist
    }

    return response.json({
      auction: {
        ...auction,
        currentBid: auction.current_bid ? Number(auction.current_bid) / 1e9 : null,
        startPrice: auction.start_price ? Number(auction.start_price) / 1e9 : null,
        endPrice: auction.end_price ? Number(auction.end_price) / 1e9 : null,
        reservePrice: auction.reserve_price ? Number(auction.reserve_price) / 1e9 : null,
        minBidIncrement: auction.min_bid_increment ? Number(auction.min_bid_increment) / 1e9 : null,
      },
      nft: nft ? { id: nft.id, name: nft.name, image_url: (nft as any).image_url, mint_address: (nft as any).mint_address, rarity: (nft as any).rarity } : null,
      bids,
      bidCount: bids.length,
    })
  },
})
