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

    // Fetch NFTs belonging to this collection
    const nfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('collection_id', '=', collection.id)
      .execute()

    return response.json({
      collection: {
        ...collection,
        slug: collection.slug || generateSlug(collection.name),
        nfts,
      },
    })
  },
})
