import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Collection Show',
  description: 'Fetch a single collection by slug with its NFTs',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')

    const collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst()

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
        nfts,
      },
    })
  },
})
