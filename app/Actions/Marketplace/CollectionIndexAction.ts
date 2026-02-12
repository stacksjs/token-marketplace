import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Helper to transform snake_case to camelCase
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

export default new Action({
  name: 'Collection Index',
  description: 'Fetch all collections with optional search and sort',
  method: 'GET',

  async handle(request: RequestInstance) {
    const search = request.getParam('search') || ''
    const sort = request.getParam('sort') || 'name'

    let query = db.selectFrom('collections').selectAll()

    // Search by name
    if (search) {
      query = query.where('name', 'like', `%${search}%`)
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

    // Transform to camelCase, get real NFT counts, and ensure slugs
    const collectionsWithSlugs = await Promise.all(
      collections.map(async (collection) => {
        const camelCased = toCamelCase(collection)

        // Count NFTs for this collection (same query pattern as CollectionShowAction)
        let nftCount = 0
        try {
          const nfts = await db
            .selectFrom('nfts')
            .selectAll()
            .where('collection_id', '=', collection.id)
            .execute()
          nftCount = nfts.length
        } catch (_) {}

        return {
          ...camelCased,
          totalAmountOfNfts: nftCount,
          slug: camelCased.slug || generateSlug(camelCased.name),
        }
      }),
    )

    return response.json({ collections: collectionsWithSlugs })
  },
})
