import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'NFT Show',
  description: 'Fetch a single NFT by ID',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = request.getParam('id')

    const nft = await db
      .selectFrom('nfts')
      .selectAll()
      .where('id', '=', Number(id))
      .executeTakeFirst()

    if (!nft) {
      return response.notFound({ error: 'NFT not found' })
    }

    // Fetch collection name
    let collectionName = null
    let collectionSlug = null
    if (nft.collection_id) {
      const collection = await db
        .selectFrom('collections')
        .select(['name', 'slug'])
        .where('id', '=', nft.collection_id)
        .executeTakeFirst()
      if (collection) {
        collectionName = collection.name
        collectionSlug = collection.slug
      }
    }

    // Fetch pending offers (exclude expired)
    let offers: any[] = []
    try {
      const allOffers = await db
        .selectFrom('offers')
        .selectAll()
        .where('nft_id', '=', Number(id))
        .where('status', '=', 'pending')
        .execute()

      const now = new Date().toISOString()
      offers = allOffers.filter((o: any) => !o.expiry_at || o.expiry_at > now)
    } catch (_) {
      // offers table may not exist yet
    }

    // Fetch active auction
    let auction = null
    try {
      auction = await db
        .selectFrom('auctions')
        .selectAll()
        .where('nft_id', '=', Number(id))
        .where('status', '=', 'active')
        .executeTakeFirst() || null
    } catch (_) {
      // auctions table may not exist yet
    }

    return response.json({
      nft: {
        ...nft,
        collection_name: collectionName,
        collection_slug: collectionSlug,
        offers,
        auction,
      },
    })
  },
})
