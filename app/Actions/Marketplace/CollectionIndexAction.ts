import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug, paginate, toCamelCase } from '../helpers'

export default new Action({
  name: 'Collection Index',
  description: 'Fetch all collections with optional search and sort',
  method: 'GET',

  async handle(request: RequestInstance) {
    const search = request.getParam('search') || ''
    const sort = request.getParam('sort') || 'name'
    const page = Math.max(1, Number(request.getParam('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(request.getParam('limit')) || 20))

    let query = db.selectFrom('collections').selectAll()

    // Search by name (escape special LIKE characters)
    if (search) {
      const escaped = search.replace(/[%_\\]/g, '\\$&')
      query = query.where('name', 'like', `%${escaped}%`)
    }

    // Sort
    switch (sort) {
      case 'recent':
        query = query.orderBy('created_at', 'desc')
        break
      case 'popular':
        query = query.orderBy('total_amount_of_nfts', 'desc')
        break
      case 'name':
      default:
        query = query.orderBy('name', 'asc')
        break
    }

    const collections = await query.execute()

    // Fetch all NFTs once for counts (avoids N+1 queries)
    const allNfts = await db.selectFrom('nfts').selectAll().execute()
    const nftCountMap: Record<string, number> = {}
    for (const nft of allNfts) {
      if (nft.collection_id != null) {
        const key = String(Math.round(Number(nft.collection_id)))
        nftCountMap[key] = (nftCountMap[key] || 0) + 1
      }
    }

    const collectionsWithSlugs = collections.map((collection) => {
      const camelCased = toCamelCase(collection)
      return {
        ...camelCased,
        totalAmountOfNfts: nftCountMap[String(collection.id)] || 0,
        slug: camelCased.slug || generateSlug(camelCased.name),
      }
    })

    const paginated = paginate(collectionsWithSlugs, page, limit)

    return response.json({
      collections: paginated.data,
      total: paginated.total,
      page: paginated.page,
      limit: paginated.limit,
      totalPages: paginated.totalPages,
    })
  },
})
