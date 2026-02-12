import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Create Escrow',
  description: 'Create an escrow for an NFT sale',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()
    const { nftId, sellerWalletAddress, price } = body

    if (!nftId || !sellerWalletAddress || !price) {
      return response.json({
        error: 'nftId, sellerWalletAddress, and price are required',
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

    if (!nft.mint_address) {
      return response.json({
        error: 'NFT has not been minted yet',
      }, 400)
    }

    if ((nft as any).owner_wallet_address !== sellerWalletAddress) {
      return response.json({
        error: 'Only the NFT owner can create an escrow',
      }, 400)
    }

    if ((nft as any).escrow_status === 'active') {
      return response.json({
        error: 'NFT is already in escrow',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const priceLamports = BigInt(Math.floor(price * 1e9))
      const transaction = await tokenService.buildCreateEscrowTransaction(
        nft.mint_address,
        sellerWalletAddress,
        priceLamports,
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
        error: 'Failed to create escrow',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
