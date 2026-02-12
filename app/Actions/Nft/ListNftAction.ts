import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'List NFT',
  description: 'Build an unsigned list transaction for client wallet signing',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { nftId, price, sellerWalletAddress } = body

    if (!nftId || price === undefined || !sellerWalletAddress) {
      return response.json({
        error: 'nftId, price, and sellerWalletAddress are required',
      }, 400)
    }

    if (typeof price !== 'number' || price < 0) {
      return response.json({
        error: 'price must be a non-negative number',
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

    // Verify ownership
    if (nft.owner_wallet_address !== sellerWalletAddress) {
      return response.json({
        error: 'Only the owner can list an NFT for sale',
      }, 400)
    }

    if (nft.is_for_sale) {
      return response.json({
        error: 'NFT is already listed for sale',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const priceLamports = BigInt(Math.floor(price * 1e9))
      const unsignedTx = await tokenService.buildListTransaction(nft.mint_address, priceLamports, sellerWalletAddress)

      return response.json({
        success: true,
        transaction: {
          serializedTransaction: unsignedTx.serializedTransaction,
          message: unsignedTx.message,
        },
        nft: {
          id: nft.id,
          name: nft.name,
          mintAddress: nft.mint_address,
          price,
          ownerWalletAddress: nft.owner_wallet_address,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to build list transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
