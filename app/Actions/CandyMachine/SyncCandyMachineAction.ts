import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

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
      const tokenService = getTokenService()

      // Fetch on-chain state from ts-tokens
      const onChainInfo = await tokenService.getCandyMachineInfo(
        candyMachine.candy_machine_address
      )

      const itemsRedeemed = onChainInfo.itemsRedeemed
      const itemsAvailable = onChainInfo.itemsAvailable
      const itemsRemaining = onChainInfo.itemsRemaining

      // Determine if sold out
      let newStatus = candyMachine.status
      if (itemsRemaining <= 0 && candyMachine.status === 'minting') {
        newStatus = 'sold_out'
      }

      // Update candy machine with authoritative on-chain data
      await db
        .updateTable('candy_machines')
        .set({
          items_available: itemsAvailable,
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
          itemsAvailable,
          itemsRedeemed,
          itemsRemaining,
        },
        onChain: {
          authority: onChainInfo.authority,
          collectionMint: onChainInfo.collectionMint,
          symbol: onChainInfo.symbol,
          sellerFeeBasisPoints: onChainInfo.sellerFeeBasisPoints,
          configLineSettings: onChainInfo.configLineSettings,
        },
        changes: {
          itemsRedeemedChanged: itemsRedeemed !== candyMachine.items_redeemed,
          itemsAvailableChanged: itemsAvailable !== candyMachine.items_available,
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
