import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug, toCamelCase } from '../helpers'

export default new Action({
  name: 'Rarity Index',
  description: 'Fetch all collections with rarity data',
  method: 'GET',

  async handle(request: RequestInstance) {
    const search = request.getParam('search') || ''
    const sort = request.getParam('sort') || 'name'

    let query = db.selectFrom('collections').selectAll()

    if (search) {
      query = query.where('name', 'like', `%${search}%`)
    }

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

    // Fetch all NFTs once for counts
    const allNfts = await db.selectFrom('nfts').selectAll().execute()
    const nftCountMap: Record<string, number> = {}
    for (const nft of allNfts) {
      if (nft.collection_id != null) {
        const key = String(Math.round(Number(nft.collection_id)))
        nftCountMap[key] = (nftCountMap[key] || 0) + 1
      }
    }

    const result = collections.map((collection) => {
      const camelCased = toCamelCase(collection)
      return {
        ...camelCased,
        slug: camelCased.slug || generateSlug(camelCased.name),
        totalItems: nftCountMap[String(collection.id)] || 0,
      }
    })

    return response.json({
      collections: result,
    })
  },
})
