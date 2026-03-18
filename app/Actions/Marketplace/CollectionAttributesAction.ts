import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { generateSlug } from '../helpers'

export default new Action({
  name: 'Collection Attributes',
  description: 'Fetch trait type → value → count aggregations for a collection',
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

    // Fetch all NFTs for this collection
    const nfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('collection_id', '=', collection.id)
      .execute()

    // Aggregate traits: { "Background": { "Purple": 342, "Blue": 1205 }, ... }
    const traitCounts: Record<string, Record<string, number>> = {}

    for (const nft of nfts) {
      let attrs = (nft as any).attributes
      if (!attrs) continue
      if (typeof attrs === 'string') {
        try { attrs = JSON.parse(attrs) } catch { continue }
      }
      if (!Array.isArray(attrs)) continue

      for (const attr of attrs) {
        const traitType = attr.trait_type || attr.traitType || attr.key
        const traitValue = attr.value
        if (!traitType || traitValue === undefined || traitValue === null) continue

        if (!traitCounts[traitType]) traitCounts[traitType] = {}
        const valueStr = String(traitValue)
        traitCounts[traitType][valueStr] = (traitCounts[traitType][valueStr] || 0) + 1
      }
    }

    return response.json({
      collectionSlug: slug,
      totalNfts: nfts.length,
      attributes: traitCounts,
    })
  },
})
