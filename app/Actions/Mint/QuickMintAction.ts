import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Quick Mint NFT',
  description: 'Build an unsigned transaction for one-off NFT minting',
  method: 'POST',
  async handle(request: RequestInstance) {
    const body = await request.json()
    const { name, walletAddress, symbol, uri, collectionId, sellerFeeBasisPoints } = body

    if (!name || !walletAddress) {
      return response.json({ error: 'name and walletAddress are required' }, 400)
    }

    let collectionMint: string | undefined
    if (collectionId) {
      const collection = await db
        .selectFrom('collections')
        .select(['mint_address'])
        .where('id', '=', Number(collectionId))
        .executeTakeFirst()
      if (collection?.mint_address) {
        collectionMint = collection.mint_address
      }
    }

    try {
      const tokenService = getTokenService()
      const unsignedTx = await tokenService.buildQuickMintTransaction({
        name,
        symbol,
        uri,
        ownerAddress: walletAddress,
        collection: collectionMint,
        sellerFeeBasisPoints,
      })

      return response.json({
        success: true,
        transaction: {
          serializedTransaction: unsignedTx.serializedTransaction,
          message: unsignedTx.message,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to build quick mint transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
