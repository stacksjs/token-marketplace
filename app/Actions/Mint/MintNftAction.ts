import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Mint NFT',
  description: 'Build an unsigned mint transaction for client wallet signing',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { candyMachineId, walletAddress, presaleId } = body

    if (!candyMachineId || !walletAddress) {
      return response.json({
        error: 'candyMachineId and walletAddress are required',
      }, 400)
    }

    // Get candy machine
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

    if (candyMachine.status !== 'minting') {
      return response.json({
        error: `Minting is not active. Current status: ${candyMachine.status}`,
      }, 400)
    }

    // Check items remaining
    const itemsRemaining = (candyMachine.items_available || 0) - (candyMachine.items_redeemed || 0)
    if (itemsRemaining <= 0) {
      return response.json({
        error: 'No items remaining to mint',
      }, 400)
    }

    // Calculate mint price
    let mintPrice = candyMachine.mint_price || 0

    // Check presale eligibility if presaleId provided
    if (presaleId) {
      const presale = await db
        .selectFrom('presales')
        .selectAll()
        .where('id', '=', Number(presaleId))
        .where('is_active', '=', 1)
        .executeTakeFirst()

      if (presale) {
        const now = new Date()
        const startsAt = presale.presale_starts_at ? new Date(presale.presale_starts_at) : null
        const expiresAt = presale.presale_expires_at ? new Date(presale.presale_expires_at) : null

        if (startsAt && now < startsAt) {
          return response.json({
            error: 'Presale has not started yet',
          }, 400)
        }

        if (expiresAt && now > expiresAt) {
          return response.json({
            error: 'Presale has expired',
          }, 400)
        }

        // Check wallet is in allowlist
        let walletAddresses: string[] = []
        try {
          walletAddresses = presale.wallet_addresses
            ? JSON.parse(presale.wallet_addresses)
            : []
        } catch {
          return response.json({ error: 'Invalid presale configuration' }, 500)
        }

        if (!walletAddresses.includes(walletAddress)) {
          return response.json({
            error: 'Wallet is not in presale allowlist',
          }, 400)
        }

        // Check max mints per wallet
        const existingMints = await db
          .selectFrom('mint_transactions')
          .select([db.fn.count('id').as('count')])
          .where('presale_id', '=', Number(presaleId))
          .where('wallet_address', '=', walletAddress)
          .where('status', 'in', ['pending', 'processing', 'confirmed'])
          .executeTakeFirst()

        const mintCount = Number(existingMints?.count || 0)
        const maxMints = presale.max_mints_per_wallet || 1

        if (mintCount >= maxMints) {
          return response.json({
            error: `Maximum mints per wallet (${maxMints}) reached for this presale`,
          }, 400)
        }

        // Apply discount (discount is in basis points: 500 = 5%, 10000 = 100%)
        const BASIS_POINTS_MAX = 10000
        if (presale.discount && presale.discount > 0 && presale.discount <= BASIS_POINTS_MAX) {
          mintPrice = Math.floor(mintPrice * (1 - (presale.discount / BASIS_POINTS_MAX)))
        }
      }
    }

    // Create mint transaction record with pending status
    const uuid = crypto.randomUUID()

    await db
      .insertInto('mint_transactions')
      .values({
        uuid,
        candy_machine_id: Number(candyMachineId),
        wallet_address: walletAddress,
        status: 'pending',
        amount_paid: mintPrice,
        presale_id: presaleId ? Number(presaleId) : null,
        created_at: new Date().toISOString(),
      })
      .execute()

    try {
      const tokenService = getTokenService()
      const unsignedTx = await tokenService.buildMintTransaction(
        candyMachine.candy_machine_address,
        walletAddress
      )

      return response.json({
        success: true,
        transaction: {
          serializedTransaction: unsignedTx.serializedTransaction,
          message: unsignedTx.message,
        },
        mint: {
          transactionId: uuid,
          amountPaid: mintPrice,
          status: 'pending',
        },
      }, 201)
    } catch (error) {
      // Update mint transaction with error
      await db
        .updateTable('mint_transactions')
        .set({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .where('uuid', '=', uuid)
        .execute()

      return response.json({
        error: 'Failed to build mint transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
        transactionId: uuid,
      }, 500)
    }
  },
})
