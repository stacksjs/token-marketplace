import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { paginate } from '../helpers'

export default new Action({
  name: 'Ended Auctions',
  description: 'Fetch recently ended auctions with results',
  method: 'GET',

  async handle(request: RequestInstance) {
    const page = Number(request.getParam('page')) || 1
    const limit = Number(request.getParam('limit')) || 20

    let auctions: any[] = []
    try {
      auctions = await db
        .selectFrom('auctions')
        .selectAll()
        .where('status', 'in', ['settled', 'ended', 'cancelled'])
        .execute()
    }
    catch {
      return response.json(paginate([], page, limit))
    }

    // Sort by most recently ended
    auctions.sort((a: any, b: any) =>
      new Date(b.updated_at || b.end_time || 0).getTime() - new Date(a.updated_at || a.end_time || 0).getTime(),
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
        finalPrice: auction.current_bid ? Number(auction.current_bid) / 1e9 : null,
        startPrice: auction.start_price ? Number(auction.start_price) / 1e9 : null,
        nft: nft ? { id: nft.id, name: nft.name, image_url: (nft as any).image_url } : null,
      }
    }))

    return response.json(paginate(enriched, page, limit))
  },
})
