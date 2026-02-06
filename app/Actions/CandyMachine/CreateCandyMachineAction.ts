import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Create Candy Machine',
  description: 'Deploy a new candy machine for an NFT collection',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const {
      collectionId,
      itemsAvailable,
      mintPrice,
      sellerFeeBasisPoints,
      symbol,
      isMutable,
      creatorAddress,
      treasuryAddress,
      collectionMint,
      configLineSettings,
      guardsConfig,
    } = body

    // Validate required fields
    if (!collectionId || !itemsAvailable || !symbol || !creatorAddress || !collectionMint) {
      return response.json({
        error: 'Missing required fields: collectionId, itemsAvailable, symbol, creatorAddress, collectionMint',
      }, 400)
    }

    // Check collection exists
    const collection = await db
      .selectFrom('collections')
      .selectAll()
      .where('id', '=', collectionId)
      .executeTakeFirst()

    if (!collection) {
      return response.notFound({ error: 'Collection not found' })
    }

    // Generate UUID for the candy machine
    const uuid = crypto.randomUUID()

    try {
      // Create candy machine record in database first with deploying status
      const insertResult = await db
        .insertInto('candy_machines')
        .values({
          uuid,
          collection_id: collectionId,
          version: 'v3',
          status: 'deploying',
          message: 'Deploying candy machine to Solana...',
          status_changed_at: new Date().toISOString(),
          items_available: itemsAvailable,
          items_redeemed: 0,
          mint_price: mintPrice || 0,
          seller_fee_basis_points: sellerFeeBasisPoints || 500,
          symbol,
          is_mutable: isMutable !== false ? 1 : 0,
          config_line_settings: configLineSettings ? JSON.stringify(configLineSettings) : null,
          guards_config: guardsConfig ? JSON.stringify(guardsConfig) : null,
          creator_address: creatorAddress,
          treasury_address: treasuryAddress || creatorAddress,
          created_at: new Date().toISOString(),
        })
        .execute()

      const candyMachineId = insertResult[0].insertId

      // Deploy candy machine on-chain
      const tokenService = getTokenService()
      const result = await tokenService.createCandyMachine({
        itemsAvailable,
        sellerFeeBasisPoints: sellerFeeBasisPoints || 500,
        symbol,
        collectionMint,
        creatorAddress,
        isMutable: isMutable !== false,
        configLineSettings,
        guards: guardsConfig,
      })

      // Update candy machine with on-chain address
      await db
        .updateTable('candy_machines')
        .set({
          candy_machine_address: result.candyMachine,
          status: 'ready',
          message: 'Candy machine deployed successfully',
          status_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', Number(candyMachineId))
        .execute()

      // Update collection with candy machine reference
      await db
        .updateTable('collections')
        .set({
          candy_machine_id: Number(candyMachineId),
          mint_address: collectionMint,
          total_amount_of_nfts: itemsAvailable,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', collectionId)
        .execute()

      // Fetch the created candy machine
      const candyMachine = await db
        .selectFrom('candy_machines')
        .selectAll()
        .where('id', '=', Number(candyMachineId))
        .executeTakeFirst()

      return response.json({
        candyMachine: {
          id: candyMachine?.id,
          uuid: candyMachine?.uuid,
          candyMachineAddress: result.candyMachine,
          collectionMint: result.collection,
          signature: result.signature,
          status: 'ready',
          itemsAvailable,
          itemsRedeemed: 0,
          mintPrice: mintPrice || 0,
          symbol,
        },
      }, 201)
    } catch (error) {
      // Update status to failed on error
      await db
        .updateTable('candy_machines')
        .set({
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          status_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .where('uuid', '=', uuid)
        .execute()

      return response.json({
        error: 'Failed to create candy machine',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
