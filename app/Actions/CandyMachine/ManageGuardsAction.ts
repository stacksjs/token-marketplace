import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Manage Guards',
  description: 'Add or update guards on a candy machine',
  method: 'POST',

  async handle(request: RequestInstance) {
    const candyMachineId = request.getParam('id')
    const body = await request.json()

    const { guards, action: guardAction } = body

    if (!guards || typeof guards !== 'object') {
      return response.json({
        error: 'guards configuration object is required',
      }, 400)
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

    try {
      const tokenService = getTokenService()

      // Build guard config from request
      const guardConfig: any = {}

      if (guards.solPayment) {
        guardConfig.solPayment = {
          lamports: BigInt(guards.solPayment.lamports),
          destination: guards.solPayment.destination,
        }
      }

      if (guards.startDate) {
        guardConfig.startDate = {
          date: new Date(guards.startDate.date).getTime() / 1000,
        }
      }

      if (guards.endDate) {
        guardConfig.endDate = {
          date: new Date(guards.endDate.date).getTime() / 1000,
        }
      }

      if (guards.mintLimit) {
        guardConfig.mintLimit = {
          id: guards.mintLimit.id || 0,
          limit: guards.mintLimit.limit,
        }
      }

      if (guards.botTax) {
        guardConfig.botTax = {
          lamports: BigInt(guards.botTax.lamports),
          lastInstruction: guards.botTax.lastInstruction ?? true,
        }
      }

      if (guards.allowList) {
        const addresses = guards.allowList.addresses || []
        const merkleRoot = tokenService.generateMerkleRoot(addresses)
        guardConfig.allowList = { merkleRoot }
      }

      let result
      if (guardAction === 'update') {
        result = await tokenService.updateGuards(
          candyMachine.candy_machine_address,
          guardConfig
        )
      } else if (guardAction === 'remove') {
        result = await tokenService.removeGuards(
          candyMachine.candy_machine_address
        )
      } else {
        result = await tokenService.addGuards(
          candyMachine.candy_machine_address,
          guardConfig
        )
      }

      // Store guards config in DB
      await db
        .updateTable('candy_machines')
        .set({
          guards_config: JSON.stringify(guards),
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', Number(candyMachineId))
        .execute()

      return response.json({
        success: true,
        action: guardAction || 'add',
        transaction: {
          signature: result.signature,
          status: result.status,
        },
        guards,
      })
    } catch (error) {
      return response.json({
        error: 'Failed to manage guards',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
