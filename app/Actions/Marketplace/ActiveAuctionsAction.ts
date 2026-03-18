import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { paginate } from '../helpers'

export default new Action({
  name: 'Active Auctions',
  description: 'Fetch all active auctions with pagination',
  method: 'GET',

  async handle(request: RequestInstance) {
    const page = Number(request.getParam('page')) || 1
    const limit = Number(request.getParam('limit')) || 20
    const type = request.getParam('type') // english | dutch | all

    let auctions: any[] = []
    try {
      const query = db
        .selectFrom('auctions')
        .selectAll()
        .where('status', '=', 'active')

      auctions = await query.execute()
    }
    catch {
      return response.json(paginate([], page, limit))
    }

    // Filter by type
    if (type && type !== 'all') {
      auctions = auctions.filter((a: any) => a.auction_type === type)
    }

    // Sort by ending soonest
    auctions.sort((a: any, b: any) =>
      new Date(a.end_time || a.ends_at || 0).getTime() - new Date(b.end_time || b.ends_at || 0).getTime(),
    )

    // Enrich with NFT data
    const enriched = await Promise.all(auctions.map(async (auction: any) => {
      const nft = await db
        .selectFrom('nfts')
        .selectAll()
        .where('id', '=', auction.nft_id)
        .executeTakeFirst()

      return {
        ...auction,
        currentBid: auction.current_bid ? Number(auction.current_bid) / 1e9 : null,
        startPrice: auction.start_price ? Number(auction.start_price) / 1e9 : null,
        endPrice: auction.end_price ? Number(auction.end_price) / 1e9 : null,
        nft: nft ? { id: nft.id, name: nft.name, image_url: (nft as any).image_url, mint_address: (nft as any).mint_address } : null,
      }
    }))

    return response.json(paginate(enriched, page, limit))
  },
})
