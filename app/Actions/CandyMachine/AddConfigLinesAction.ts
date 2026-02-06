import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Add Config Lines',
  description: 'Add NFT metadata config lines to a candy machine',
  method: 'POST',

  async handle(request: RequestInstance) {
    const candyMachineId = request.getParam('id')
    const body = await request.json()

    const { configLines, startIndex } = body

    if (!configLines || !Array.isArray(configLines) || configLines.length === 0) {
      return response.json({
        error: 'configLines array is required and must not be empty',
      }, 400)
    }

    // Validate config line structure
    for (const line of configLines) {
      if (!line.name || !line.uri) {
        return response.json({
          error: 'Each config line must have name and uri properties',
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

    if (candyMachine.status !== 'ready' && candyMachine.status !== 'minting') {
      return response.json({
        error: `Cannot add config lines when candy machine status is: ${candyMachine.status}`,
      }, 400)
    }

    try {
      const tokenService = getTokenService()

      const results = await tokenService.addConfigLines(
        candyMachine.candy_machine_address,
        configLines,
        startIndex || 0
      )

      // Update candy machine status
      await db
        .updateTable('candy_machines')
        .set({
          message: `Added ${configLines.length} config lines`,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', Number(candyMachineId))
        .execute()

      return response.json({
        success: true,
        linesAdded: configLines.length,
        startIndex: startIndex || 0,
        transactions: results.map(r => ({
          signature: r.signature,
          status: r.status,
        })),
      })
    } catch (error) {
      return response.json({
        error: 'Failed to add config lines',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
