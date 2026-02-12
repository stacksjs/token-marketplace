import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Cancel Escrow',
  description: 'Cancel an escrow and return NFT to seller',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()
    const { nftId, sellerWalletAddress } = body

    if (!nftId || !sellerWalletAddress) {
      return response.json({
        error: 'nftId and sellerWalletAddress are required',
      }, 400)
    }

    // Get NFT
    const nft = await db
      .selectFrom('nfts')
      .selectAll()
      .where('id', '=', Number(nftId))
      .executeTakeFirst()

    if (!nft) {
      return response.notFound({ error: 'NFT not found' })
    }

    if ((nft as any).escrow_status !== 'active') {
      return response.json({
        error: 'NFT is not in escrow',
      }, 400)
    }

    if ((nft as any).owner_wallet_address !== sellerWalletAddress) {
      return response.json({
        error: 'Only the NFT owner can cancel the escrow',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const escrowId = (nft as any).escrow_id || String(nft.id)
      const transaction = await tokenService.buildCancelEscrowTransaction(
        escrowId,
        sellerWalletAddress,
      )

      // Update NFT escrow status in DB
      await db
        .updateTable('nfts')
        .set({
          escrow_status: null,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', Number(nftId))
        .execute()

      return response.json({
        success: true,
        transaction: {
          serializedTransaction: transaction.serializedTransaction,
          message: transaction.message,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to cancel escrow',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
