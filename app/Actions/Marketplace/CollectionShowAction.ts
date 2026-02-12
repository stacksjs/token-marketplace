import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug, paginate } from '../helpers'

export default new Action({
  name: 'Collection Show',
  description: 'Fetch a single collection by slug with its NFTs',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')

    // First try to find by slug column
    let collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst()

    // If not found, try to find by generated slug from name
    if (!collection) {
      const allCollections = await db
        .selectFrom('collections')
        .selectAll()
        .execute()

      collection = allCollections.find(c => generateSlug(c.name) === slug)
    }

    if (!collection) {
      return response.notFound({ error: 'Collection not found' })
    }

    // Parse query params for filtering, sorting, pagination
    const page = Math.max(1, Number(request.getParam('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(request.getParam('limit')) || 20))
    const minPrice = request.getParam('minPrice') ? Number(request.getParam('minPrice')) : null
    const maxPrice = request.getParam('maxPrice') ? Number(request.getParam('maxPrice')) : null
    const rarity = request.getParam('rarity') || null
    const sort = request.getParam('sort') || 'recent'
    const forSale = request.getParam('forSale')

    // Fetch NFTs belonging to this collection
    let nfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('collection_id', '=', collection.id)
      .execute()

    // Apply filters
    if (forSale === 'true') {
      nfts = nfts.filter((n: any) => n.is_for_sale === 1 || n.is_for_sale === true)
    }
    if (minPrice !== null) {
      nfts = nfts.filter((n: any) => n.listing_price && Number(n.listing_price) >= minPrice * 1e9)
    }
    if (maxPrice !== null) {
      nfts = nfts.filter((n: any) => n.listing_price && Number(n.listing_price) <= maxPrice * 1e9)
    }
    if (rarity) {
      nfts = nfts.filter((n: any) => (n.rarity || '').toLowerCase() === rarity.toLowerCase())
    }

    // Sort
    switch (sort) {
      case 'price_asc':
        nfts.sort((a: any, b: any) => (Number(a.listing_price) || 0) - (Number(b.listing_price) || 0))
        break
      case 'price_desc':
        nfts.sort((a: any, b: any) => (Number(b.listing_price) || 0) - (Number(a.listing_price) || 0))
        break
      case 'rarity': {
        const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']
        nfts.sort((a: any, b: any) => rarityOrder.indexOf(a.rarity || 'Common') - rarityOrder.indexOf(b.rarity || 'Common'))
        break
      }
      case 'recent':
      default:
        nfts.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        break
    }

    const paginated = paginate(nfts, page, limit)

    return response.json({
      collection: {
        ...collection,
        slug: collection.slug || generateSlug(collection.name),
      },
      nfts: paginated.data,
      total: paginated.total,
      page: paginated.page,
      limit: paginated.limit,
      totalPages: paginated.totalPages,
    })
  },
})
