import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Activity Feed',
  description: 'Fetch recent marketplace activity',
  method: 'GET',

  async handle(request: RequestInstance) {
    const collectionSlug = request.getParam('collectionSlug') || ''
    const limit = Math.min(50, Math.max(1, Number(request.getParam('limit')) || 20))
    const page = Math.max(1, Number(request.getParam('page')) || 1)

    // Gather events from multiple tables
    const events: Array<{
      type: string
      timestamp: string
      nftName: string
      nftImage: string
      price: number | null
      fromAddress: string
      toAddress: string
      collectionId: number | null
    }> = []

    // Get collection ID if filtering by slug
    let collectionId: number | null = null
    if (collectionSlug) {
      let collection = await db
        .selectFrom('collections')
        .selectAll()
        .where('slug', '=', collectionSlug)
        .executeTakeFirst()

      if (!collection) {
        const allCollections = await db.selectFrom('collections').selectAll().execute()
        collection = allCollections.find(c => generateSlug(c.name) === collectionSlug)
      }

      if (collection) {
        collectionId = collection.id as number
      }
    }

    // Fetch recent mints
    try {
      const mints = await db
        .selectFrom('mint_transactions')
        .selectAll()
        .where('status', '=', 'confirmed')
        .orderBy('created_at', 'desc')
        .limit(50)
        .execute()

      for (const m of mints) {
        let nftName = 'NFT'
        let nftImage = ''
        let nftCollectionId: number | null = null
        if ((m as any).mint_address) {
          const nft = await db
            .selectFrom('nfts')
            .select(['name', 'image_url', 'collection_id'])
            .where('mint_address', '=', (m as any).mint_address)
            .executeTakeFirst()
          if (nft) {
            nftName = nft.name
            nftImage = (nft as any).image_url || ''
            nftCollectionId = nft.collection_id as number | null
          }
        }
        if (collectionId && nftCollectionId !== collectionId) continue
        events.push({
          type: 'mint',
          timestamp: (m as any).created_at || '',
          nftName,
          nftImage,
          price: (m as any).amount_paid || null,
          fromAddress: '',
          toAddress: (m as any).wallet_address || '',
          collectionId: nftCollectionId,
        })
      }
    } catch (_) {}

    // Fetch recent offers
    try {
      const offers = await db
        .selectFrom('offers')
        .selectAll()
        .orderBy('created_at', 'desc')
        .limit(50)
        .execute()

      for (const o of offers) {
        const nft = await db
          .selectFrom('nfts')
          .select(['name', 'image_url', 'collection_id', 'owner_wallet_address'])
          .where('id', '=', Number((o as any).nft_id))
          .executeTakeFirst()
        if (!nft) continue
        if (collectionId && (nft.collection_id as number) !== collectionId) continue
        events.push({
          type: (o as any).status === 'accepted' ? 'sale' : 'offer',
          timestamp: (o as any).created_at || '',
          nftName: nft.name,
          nftImage: (nft as any).image_url || '',
          price: (o as any).amount ? Number((o as any).amount) / 1e9 : null,
          fromAddress: (o as any).buyer_wallet_address || '',
          toAddress: (nft as any).owner_wallet_address || '',
          collectionId: nft.collection_id as number | null,
        })
      }
    } catch (_) {}

    // Sort all events by timestamp desc
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Paginate
    const offset = (page - 1) * limit
    const paginatedEvents = events.slice(offset, offset + limit)

    return response.json({
      activity: paginatedEvents,
      total: events.length,
      page,
      limit,
    })
  },
})
