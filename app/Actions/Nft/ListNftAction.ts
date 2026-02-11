import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'List NFT',
  description: 'List an NFT for sale on the marketplace using on-chain delegate pattern',
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
      // On-chain listing via ts-tokens delegate pattern
      const tokenService = getTokenService()
      const priceLamports = BigInt(Math.floor(price * 1e9))
      const listing = await tokenService.listNFTForSale(nft.mint_address, priceLamports)

      // Update NFT in database
      await db
        .updateTable('nfts')
        .set({
          is_for_sale: 1,
          price,
          listing_id: listing.id,
          delegate_address: listing.delegateAddress,
          listed_at: new Date().toISOString(),
          listing_price: Number(priceLamports),
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
        listing: {
          id: listing.id,
          signature: listing.signature,
          delegateAddress: listing.delegateAddress,
          delegated: listing.delegated,
        },
        nft: {
          id: updatedNft?.id,
          uuid: updatedNft?.uuid,
          name: updatedNft?.name,
          mintAddress: updatedNft?.mint_address,
          imageUrl: updatedNft?.image_url,
          price: updatedNft?.price,
          isForSale: updatedNft?.is_for_sale === 1,
          ownerWalletAddress: updatedNft?.owner_wallet_address,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to list NFT',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
