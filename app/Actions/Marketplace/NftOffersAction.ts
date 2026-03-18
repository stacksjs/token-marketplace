import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'NFT Offers',
  description: 'Fetch active offers for a single NFT, sorted by amount descending',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = Number(request.getParam('id'))

    const nft = await db
      .selectFrom('nfts')
      .select(['id'])
      .where('id', '=', id)
      .executeTakeFirst()

    if (!nft) {
      return response.notFound({ error: 'NFT not found' })
    }

    let offers: any[] = []
    try {
      const allOffers = await db
        .selectFrom('offers')
        .selectAll()
        .where('nft_id', '=', id)
        .where('status', '=', 'pending')
        .execute()

      const now = new Date().toISOString()
      offers = allOffers
        .filter((o: any) => !o.expiry_at || o.expiry_at > now)
        .map((o: any) => ({
          id: o.id,
          offerer: o.buyer_wallet_address || o.offerer_wallet_address,
          amount: Number(o.amount || 0) / 1e9,
          expiresAt: o.expiry_at || null,
          status: o.status,
          createdAt: o.created_at,
        }))
        .sort((a: any, b: any) => b.amount - a.amount)
    }
    catch {
      // offers table may not exist yet
    }

    return response.json({ nftId: id, offers })
  },
})
