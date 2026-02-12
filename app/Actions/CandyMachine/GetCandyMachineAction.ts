import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'
import { toCamelCase as _toCamelCase } from '../helpers'

const JSON_FIELDS = ['config_line_settings', 'guards_config']
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  return _toCamelCase(obj, JSON_FIELDS)
}

export default new Action({
  name: 'Get Candy Machine',
  description: 'Get candy machine details by ID',
  method: 'GET',

  async handle(request: RequestInstance) {
    const candyMachineId = request.getParam('id')
    const includeOnChain = request.query?.onchain === 'true'

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

    // Optionally fetch on-chain state
    let onChainData = null
    if (includeOnChain && candyMachine.candy_machine_address) {
      try {
        const tokenService = getTokenService()
        onChainData = await tokenService.getCandyMachineInfo(
          candyMachine.candy_machine_address
        )
      } catch (error) {
        onChainData = { error: 'Failed to fetch on-chain data' }
      }
    }

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
      onChain: onChainData,
    })
  },
})
