import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'NFT Index',
  description: 'Fetch available NFTs with search, filter, sort, and pagination',
  method: 'GET',

  async handle(request: RequestInstance) {
    const search = request.getParam('search') || ''
    const collection = request.getParam('collection') || ''
    const rarity = request.getParam('rarity') || ''
    const minPrice = request.getParam('minPrice') || ''
    const maxPrice = request.getParam('maxPrice') || ''
    const sort = request.getParam('sort') || 'recent'
    const page = Math.max(1, Number(request.getParam('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(request.getParam('limit')) || 20))
    const offset = (page - 1) * limit

    let query = db.selectFrom('nfts').selectAll()

    // Default filter: for sale or minting
    if (!search && !collection) {
      query = query.where((eb) =>
        eb.or([
          eb('is_for_sale', '=', 1),
          eb('is_minting', '=', 1),
        ]),
      )
    }

    // Search by name
    if (search) {
      query = query.where('name', 'like', `%${search}%`)
    }

    // Filter by collection
    if (collection) {
      query = query.where('collection_id', '=', Number(collection))
    }

    // Filter by rarity
    if (rarity) {
      query = query.where('rarity', '=', rarity)
    }

    // Filter by price range
    if (minPrice) {
      query = query.where('price', '>=', Number(minPrice))
    }
    if (maxPrice) {
      query = query.where('price', '<=', Number(maxPrice))
    }

    // Sort
    switch (sort) {
      case 'price_asc':
        query = query.orderBy('price', 'asc')
        break
      case 'price_desc':
        query = query.orderBy('price', 'desc')
        break
      case 'rarity':
        query = query.orderBy('rarity_rank', 'asc')
        break
      case 'recent':
      default:
        query = query.orderBy('created_at', 'desc')
        break
    }

    // Pagination
    const nfts = await query.limit(limit).offset(offset).execute()

    return response.json({ nfts, page, limit })
  },
})
