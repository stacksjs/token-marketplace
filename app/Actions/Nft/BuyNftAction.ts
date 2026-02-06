import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Buy NFT',
  description: 'Purchase an NFT on the secondary market',
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

    if (!nft.is_for_sale) {
      return response.json({
        error: 'NFT is not for sale',
      }, 400)
    }

    if (!nft.mint_address) {
      return response.json({
        error: 'NFT has not been minted yet',
      }, 400)
    }

    if (!nft.owner_wallet_address) {
      return response.json({
        error: 'NFT owner information is missing',
      }, 400)
    }

    if (nft.owner_wallet_address === buyerWalletAddress) {
      return response.json({
        error: 'Cannot buy your own NFT',
      }, 400)
    }

    try {
      // Execute transfer on-chain
      const tokenService = getTokenService()
      const result = await tokenService.transferNFT(
        nft.mint_address,
        buyerWalletAddress
      )

      // Update NFT ownership
      await db
        .updateTable('nfts')
        .set({
          owner_wallet_address: buyerWalletAddress,
          is_for_sale: 0,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', Number(nftId))
        .execute()

      // Get updated NFT
      const updatedNft = await db
        .selectFrom('nfts')
        .selectAll()
        .where('id', '=', Number(nftId))
        .executeTakeFirst()

      return response.json({
        success: true,
        transaction: {
          signature: result.signature,
          status: result.status,
        },
        nft: {
          id: updatedNft?.id,
          name: updatedNft?.name,
          mintAddress: updatedNft?.mint_address,
          previousOwner: nft.owner_wallet_address,
          newOwner: buyerWalletAddress,
          price: nft.price,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to purchase NFT',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
