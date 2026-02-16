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

    // Fetch recent mints with JOIN to nfts (eliminates N+1)
    try {
      let mintQuery = db
        .selectFrom('mint_transactions')
        .leftJoin('nfts', 'nfts.mint_address', 'mint_transactions.mint_address' as any)
        .select([
          'mint_transactions.created_at',
          'mint_transactions.wallet_address',
          'mint_transactions.amount_paid',
          'nfts.name as nft_name',
          'nfts.image_url as nft_image_url',
          'nfts.collection_id as nft_collection_id',
        ])
        .where('mint_transactions.status', '=', 'confirmed')
        .orderBy('mint_transactions.created_at', 'desc')
        .limit(50)

      if (collectionId) {
        mintQuery = mintQuery.where('nfts.collection_id', '=', collectionId)
      }

      const mints = await mintQuery.execute()

      for (const m of mints) {
        events.push({
          type: 'mint',
          timestamp: (m as any).created_at || '',
          nftName: (m as any).nft_name || 'NFT',
          nftImage: (m as any).nft_image_url || '',
          price: (m as any).amount_paid || null,
          fromAddress: '',
          toAddress: (m as any).wallet_address || '',
          collectionId: (m as any).nft_collection_id as number | null,
        })
      }
    } catch (_) {}

    // Fetch recent offers with JOIN to nfts (eliminates N+1)
    try {
      let offerQuery = db
        .selectFrom('offers')
        .leftJoin('nfts', 'nfts.id', 'offers.nft_id')
        .select([
          'offers.created_at',
          'offers.status',
          'offers.amount',
          'offers.buyer_wallet_address',
          'nfts.name as nft_name',
          'nfts.image_url as nft_image_url',
          'nfts.collection_id as nft_collection_id',
          'nfts.owner_wallet_address as nft_owner_wallet',
        ])
        .orderBy('offers.created_at', 'desc')
        .limit(50)

      if (collectionId) {
        offerQuery = offerQuery.where('nfts.collection_id', '=', collectionId)
      }

      const offers = await offerQuery.execute()

      for (const o of offers) {
        events.push({
          type: (o as any).status === 'accepted' ? 'sale' : 'offer',
          timestamp: (o as any).created_at || '',
          nftName: (o as any).nft_name || 'NFT',
          nftImage: (o as any).nft_image_url || '',
          price: (o as any).amount ? Number((o as any).amount) / 1e9 : null,
          fromAddress: (o as any).buyer_wallet_address || '',
          toAddress: (o as any).nft_owner_wallet || '',
          collectionId: (o as any).nft_collection_id as number | null,
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
