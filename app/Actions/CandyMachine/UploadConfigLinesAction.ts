import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Upload Config Lines',
  description: 'Upload config lines to a candy machine via JSON',
  method: 'POST',

  async handle(request: RequestInstance) {
    const candyMachineId = request.getParam('id')
    const body = await request.json()

    const { items, startIndex } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return response.json({
        error: 'items array is required with at least one { name, uri } entry',
      }, 400)
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      if (!items[i].name || !items[i].uri) {
        return response.json({
          error: `Item at index ${i} must have both name and uri`,
        }, 400)
      }
    }

    // Get candy machine from database
    const candyMachine = await db
      .selectFrom('candy_machines')
      .selectAll()
      .where('id', '=', Number(candyMachineId))
      .executeTakeFirst()

    if (!candyMachine) {
      return response.notFound({ error: 'Candy machine not found' })
    }

    if (!candyMachine.candy_machine_address) {
      return response.json({
        error: 'Candy machine has not been deployed yet',
      }, 400)
    }

    if (!['ready', 'minting'].includes(candyMachine.status || '')) {
      return response.json({
        error: `Cannot upload config lines when status is ${candyMachine.status}`,
      }, 400)
    }

    try {
      const tokenService = getTokenService()

      const configLines = items.map((item: { name: string; uri: string }) => ({
        name: item.name,
        uri: item.uri,
      }))

      const results = await tokenService.addConfigLines(
        candyMachine.candy_machine_address,
        configLines,
        startIndex || 0
      )

      return response.json({
        success: true,
        uploaded: items.length,
        batches: results.length,
        transactions: results.map(r => ({
          signature: r.signature,
          status: r.status,
        })),
      })
    } catch (error) {
      return response.json({
        error: 'Failed to upload config lines',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
