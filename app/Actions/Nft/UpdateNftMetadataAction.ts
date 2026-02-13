import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Update NFT Metadata',
  description: 'Build an unsigned transaction to update NFT metadata',
  method: 'POST',
  async handle(request: RequestInstance) {
    const body = await request.json()
    const { nftId, walletAddress, name, symbol, uri, sellerFeeBasisPoints } = body

    if (!nftId || !walletAddress) {
      return response.json({ error: 'nftId and walletAddress are required' }, 400)
    }

    if (!name && !symbol && !uri && sellerFeeBasisPoints === undefined) {
      return response.json({ error: 'At least one field to update is required (name, symbol, uri, or sellerFeeBasisPoints)' }, 400)
    }

    const nft = await db
      .selectFrom('nfts')
      .selectAll()
      .where('id', '=', Number(nftId))
      .executeTakeFirst()

    if (!nft) {
      return response.notFound({ error: 'NFT not found' })
    }

    if (!nft.mint_address) {
      return response.json({ error: 'NFT has not been minted yet' }, 400)
    }

    if (nft.owner_wallet_address !== walletAddress) {
      return response.json({ error: 'Only the owner can update NFT metadata' }, 403)
    }

    try {
      const tokenService = getTokenService()
      const unsignedTx = await tokenService.buildUpdateNFTTransaction({
        mint: nft.mint_address,
        name,
        symbol,
        uri,
        sellerFeeBasisPoints,
        ownerAddress: walletAddress,
      })

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
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to build update transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
