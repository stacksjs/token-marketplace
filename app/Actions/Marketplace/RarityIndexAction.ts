import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'

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

    return response.json({
      collections: collections.map(toCamelCase),
    })
  },
})
