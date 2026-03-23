import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { indexerService } from '../../Services/IndexerService'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Collection Trait Counts',
  description: 'Get aggregated trait counts for a collection, used to power the filter sidebar',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')

    let collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst()

    if (!collection) {
      const allCollections = await db
        .selectFrom('collections')
        .selectAll()
        .execute()
      collection = allCollections.find((c: any) => generateSlug(c.name) === slug)
    }

    if (!collection) {
      return response.notFound({ error: 'Collection not found' })
    }

    const traitCounts = await indexerService.getTraitCounts(db, collection.id)

    // Group by trait type for easier frontend consumption
    const grouped: Record<string, Array<{ value: string, count: number }>> = {}
    for (const trait of traitCounts) {
      if (!grouped[trait.traitType]) {
        grouped[trait.traitType] = []
      }
      grouped[trait.traitType].push({
        value: trait.traitValue,
        count: trait.count,
      })
    }

    return response.json({
      collectionId: collection.id,
      traits: grouped,
      totalTraitTypes: Object.keys(grouped).length,
    })
  },
})
