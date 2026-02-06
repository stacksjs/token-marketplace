import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Sync Candy Machine',
  description: 'Sync candy machine state from on-chain data',
  method: 'POST',

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

    if (!candyMachine.candy_machine_address) {
      return response.json({
        error: 'Candy machine has not been deployed yet',
      }, 400)
    }

    try {
      // In a real implementation, we would fetch on-chain state here
      // For now, we'll sync based on our database records

      // Count confirmed mint transactions
      const mintStats = await db
        .selectFrom('mint_transactions')
        .select([
          db.fn.count('id').as('confirmedMints'),
        ])
        .where('candy_machine_id', '=', Number(candyMachineId))
        .where('status', '=', 'confirmed')
        .executeTakeFirst()

      const itemsRedeemed = Number(mintStats?.confirmedMints || 0)
      const itemsRemaining = (candyMachine.items_available || 0) - itemsRedeemed

      // Determine if sold out
      let newStatus = candyMachine.status
      if (itemsRemaining <= 0 && candyMachine.status === 'minting') {
        newStatus = 'sold_out'
      }

      // Update candy machine
      await db
        .updateTable('candy_machines')
        .set({
          items_redeemed: itemsRedeemed,
          status: newStatus,
          message: newStatus === 'sold_out' ? 'All items have been minted' : candyMachine.message,
          status_changed_at: newStatus !== candyMachine.status
            ? new Date().toISOString()
            : candyMachine.status_changed_at,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', Number(candyMachineId))
        .execute()

      // Update collection if sold out
      if (newStatus === 'sold_out' && candyMachine.collection_id) {
        await db
          .updateTable('collections')
          .set({
            is_minting: 0,
            updated_at: new Date().toISOString(),
          })
          .where('id', '=', candyMachine.collection_id)
          .execute()
      }

      // Fetch updated candy machine
      const updated = await db
        .selectFrom('candy_machines')
        .selectAll()
        .where('id', '=', Number(candyMachineId))
        .executeTakeFirst()

      return response.json({
        synced: true,
        candyMachine: {
          id: updated?.id,
          uuid: updated?.uuid,
          candyMachineAddress: updated?.candy_machine_address,
          status: updated?.status,
          itemsAvailable: updated?.items_available,
          itemsRedeemed: updated?.items_redeemed,
          itemsRemaining,
        },
        changes: {
          itemsRedeemedChanged: itemsRedeemed !== candyMachine.items_redeemed,
          statusChanged: newStatus !== candyMachine.status,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to sync candy machine',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
