import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { paginate } from '../helpers'

export default new Action({
  name: 'Auction Bids',
  description: 'Fetch paginated bids for an auction',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = Number(request.getParam('id'))
    const page = Number(request.getParam('page')) || 1
    const limit = Number(request.getParam('limit')) || 50

    let auction: any = null
    try {
      auction = await db
        .selectFrom('auctions')
        .select(['id'])
        .where('id', '=', id)
        .executeTakeFirst()
    }
    catch {
      return response.notFound({ error: 'Auction not found' })
    }

    if (!auction) {
      return response.notFound({ error: 'Auction not found' })
    }

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

    return response.json(paginate(bids, page, limit))
  },
})
