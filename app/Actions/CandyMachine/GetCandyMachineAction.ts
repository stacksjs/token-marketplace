import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

// Helper to transform snake_case to camelCase
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    // Parse JSON fields
    if ((key === 'config_line_settings' || key === 'guards_config') && typeof value === 'string') {
      try {
        result[camelKey] = JSON.parse(value)
      } catch {
        result[camelKey] = value
      }
    } else {
      result[camelKey] = value
    }
  }
  return result
}

export default new Action({
  name: 'Get Candy Machine',
  description: 'Get candy machine details by ID',
  method: 'GET',

  async handle(request: RequestInstance) {
    const candyMachineId = request.getParam('id')

    // Get candy machine from database
    const candyMachine = await db
      .selectFrom('candy_machines')
      .selectAll()
      .where('id', '=', Number(candyMachineId))
      .executeTakeFirst()

    if (!candyMachine) {
      return response.notFound({ error: 'Candy machine not found' })
    }

    // Get associated collection
    let collection = null
    if (candyMachine.collection_id) {
      collection = await db
        .selectFrom('collections')
        .selectAll()
        .where('id', '=', candyMachine.collection_id)
        .executeTakeFirst()
    }

    // Get mint transaction stats
    const mintStats = await db
      .selectFrom('mint_transactions')
      .select([
        db.fn.count('id').as('totalMints'),
      ])
      .where('candy_machine_id', '=', Number(candyMachineId))
      .where('status', '=', 'confirmed')
      .executeTakeFirst()

    // Get recent mint transactions
    const recentMints = await db
      .selectFrom('mint_transactions')
      .selectAll()
      .where('candy_machine_id', '=', Number(candyMachineId))
      .orderBy('created_at', 'desc')
      .limit(10)
      .execute()

    return response.json({
      candyMachine: toCamelCase(candyMachine),
      collection: collection ? toCamelCase(collection) : null,
      stats: {
        totalMints: Number(mintStats?.totalMints || 0),
        itemsRemaining: (candyMachine.items_available || 0) - (candyMachine.items_redeemed || 0),
        percentMinted: candyMachine.items_available
          ? Math.round(((candyMachine.items_redeemed || 0) / candyMachine.items_available) * 100)
          : 0,
      },
      recentMints: recentMints.map(toCamelCase),
    })
  },
})
