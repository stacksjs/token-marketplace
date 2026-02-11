import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Delist NFT',
  description: 'Remove an NFT listing from the marketplace',
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

    if (!nft.is_for_sale) {
      return response.json({
        error: 'NFT is not currently listed for sale',
      }, 400)
    }

    if (nft.owner_wallet_address !== sellerWalletAddress) {
      return response.json({
        error: 'Only the owner can delist an NFT',
      }, 400)
    }

    if (!nft.mint_address) {
      return response.json({
        error: 'NFT has not been minted yet',
      }, 400)
    }

    try {
      // Revoke delegate on-chain
      const tokenService = getTokenService()
      const result = await tokenService.delistNFT(nft.mint_address)

      // Update database
      await db
        .updateTable('nfts')
        .set({
          is_for_sale: 0,
          listing_id: null,
          delegate_address: null,
          listed_at: null,
          listing_price: null,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', Number(nftId))
        .execute()

      return response.json({
        success: true,
        transaction: {
          signature: result.signature,
          status: result.status,
        },
        nft: {
          id: nft.id,
          name: nft.name,
          mintAddress: nft.mint_address,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to delist NFT',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
