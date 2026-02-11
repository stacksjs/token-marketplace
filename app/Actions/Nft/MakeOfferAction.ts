import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Make Offer',
  description: 'Make an offer on an NFT',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { nftId, amount, buyerWalletAddress, expiry } = body

    if (!nftId || !amount || !buyerWalletAddress) {
      return response.json({
        error: 'nftId, amount, and buyerWalletAddress are required',
      }, 400)
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return response.json({
        error: 'amount must be a positive number',
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

    if (nft.owner_wallet_address === buyerWalletAddress) {
      return response.json({
        error: 'Cannot make an offer on your own NFT',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const amountLamports = BigInt(Math.floor(amount * 1e9))
      const offer = await tokenService.makeOffer(nft.mint_address, amountLamports, expiry)

      // Store offer in database
      await db
        .insertInto('offers')
        .values({
          uuid: offer.id,
          nft_id: Number(nftId),
          mint_address: nft.mint_address,
          buyer_wallet_address: buyerWalletAddress,
          amount: Number(amountLamports),
          currency: 'SOL',
          status: 'pending',
          expiry_at: expiry ? new Date(expiry * 1000).toISOString() : null,
          created_at: new Date().toISOString(),
        })
        .execute()

      return response.json({
        success: true,
        offer: {
          id: offer.id,
          nftId,
          mintAddress: nft.mint_address,
          amount,
          amountLamports: amountLamports.toString(),
          buyerWalletAddress,
          status: 'pending',
          expiry,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to make offer',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
