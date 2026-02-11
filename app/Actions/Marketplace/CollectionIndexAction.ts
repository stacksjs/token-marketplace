import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default new Action({
  name: 'Collection Index',
  description: 'Fetch all collections',
  method: 'GET',

  async handle() {
    const collections = await db
      .selectFrom('collections')
      .selectAll()
      .execute()

    // Ensure each collection has a slug
    const collectionsWithSlugs = collections.map(collection => ({
      ...collection,
      slug: collection.slug || generateSlug(collection.name),
    }))

    return response.json({ collections: collectionsWithSlugs })
  },
})
