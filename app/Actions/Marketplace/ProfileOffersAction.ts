import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Profile Offers',
  description: 'Fetch offers made and received by a wallet',
  method: 'GET',

  async handle(request: RequestInstance) {
    const wallet = request.getParam('wallet')

    if (!wallet) {
      return response.json({ error: 'wallet address required' }, 422)
    }

    let made: any[] = []
    let received: any[] = []

    try {
      // Offers made by this wallet
      const madeOffers = await db
        .selectFrom('offers')
        .selectAll()
        .where('buyer_wallet_address', '=', wallet)
        .execute()

      made = await Promise.all(madeOffers.map(async (o: any) => {
        const nft = o.nft_id ? await db.selectFrom('nfts').selectAll().where('id', '=', o.nft_id).executeTakeFirst() : null
        return {
          id: o.id,
          amount: Number(o.amount || 0) / 1e9,
          status: o.status,
          expiresAt: o.expiry_at,
          createdAt: o.created_at,
          nft: nft ? { id: nft.id, name: nft.name, image: (nft as any).image_url } : null,
        }
      }))

      // Offers received on NFTs owned by this wallet
      const ownedNfts = await db
        .selectFrom('nfts')
        .select(['id', 'name', 'image_url'] as any)
        .where('owner_wallet_address', '=', wallet)
        .execute()

      const ownedIds = ownedNfts.map((n: any) => n.id)

      if (ownedIds.length > 0) {
        const receivedOffers = await db
          .selectFrom('offers')
          .selectAll()
          .where('nft_id', 'in', ownedIds)
          .execute()

        received = receivedOffers.map((o: any) => {
          const nft = ownedNfts.find((n: any) => n.id === o.nft_id)
          return {
            id: o.id,
            offerer: o.buyer_wallet_address,
            amount: Number(o.amount || 0) / 1e9,
            status: o.status,
            expiresAt: o.expiry_at,
            createdAt: o.created_at,
            nft: nft ? { id: (nft as any).id, name: (nft as any).name, image: (nft as any).image_url } : null,
          }
        })
      }
    }
    catch {
      // offers table may not exist
    }

    // Sort by most recent
    made.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    received.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())

    return response.json({ wallet, made, received })
  },
})
