import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Settle Escrow',
  description: 'Settle an escrow and transfer NFT to buyer',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()
    const { nftId, buyerWalletAddress } = body

    if (!nftId || !buyerWalletAddress) {
      return response.json({
        error: 'nftId and buyerWalletAddress are required',
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

    try {
      const tokenService = getTokenService()
      const escrowId = (nft as any).escrow_id || String(nft.id)
      const transaction = await tokenService.buildSettleEscrowTransaction(
        escrowId,
        buyerWalletAddress,
      )

      return response.json({
        success: true,
        transaction: {
          serializedTransaction: transaction.serializedTransaction,
          message: transaction.message,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to settle escrow',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
