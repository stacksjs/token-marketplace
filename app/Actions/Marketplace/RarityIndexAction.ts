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
  name: 'Rarity Index',
  description: 'Fetch all collections with rarity data',
  method: 'GET',

  async handle() {
    const collections = await db
      .selectFrom('collections')
      .selectAll()
      .execute()

    const result = collections.map((collection) => {
      const camelCased = toCamelCase(collection)
      return {
        ...camelCased,
        slug: camelCased.slug || generateSlug(camelCased.name),
      }
    })
    console.log('[RarityIndex] returning', result.length, 'collections:', JSON.stringify(result.slice(0, 2)))

    return response.json({
      collections: result,
    })
  },
})
