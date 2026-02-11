import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Create Auction',
  description: 'Create an auction for an NFT',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()

    const { nftId, sellerWalletAddress, auctionType, startingPrice, reservePrice, duration } = body

    if (!nftId || !sellerWalletAddress || !startingPrice || !duration) {
      return response.json({
        error: 'nftId, sellerWalletAddress, startingPrice, and duration are required',
      }, 400)
    }

    const type = auctionType || 'english'
    if (!['english', 'dutch'].includes(type)) {
      return response.json({
        error: 'auctionType must be "english" or "dutch"',
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

    if (nft.owner_wallet_address !== sellerWalletAddress) {
      return response.json({
        error: 'Only the NFT owner can create an auction',
      }, 400)
    }

    if (nft.is_for_sale) {
      return response.json({
        error: 'NFT is already listed for sale. Delist it first.',
      }, 400)
    }

    try {
      const tokenService = getTokenService()
      const startPriceLamports = BigInt(Math.floor(startingPrice * 1e9))
      const reservePriceLamports = reservePrice ? BigInt(Math.floor(reservePrice * 1e9)) : undefined

      const auction = await tokenService.createAuction(nft.mint_address, {
        type,
        startPrice: startPriceLamports,
        reservePrice: reservePriceLamports,
        duration,
      })

      // Store auction in database
      const now = new Date()
      await db
        .insertInto('auctions')
        .values({
          uuid: auction.id,
          nft_id: Number(nftId),
          mint_address: nft.mint_address,
          seller_wallet_address: sellerWalletAddress,
          auction_type: type,
          starting_price: Number(startPriceLamports),
          reserve_price: reservePriceLamports ? Number(reservePriceLamports) : null,
          status: 'active',
          starts_at: now.toISOString(),
          ends_at: new Date(now.getTime() + duration * 1000).toISOString(),
          created_at: now.toISOString(),
        })
        .execute()

      return response.json({
        success: true,
        auction: {
          id: auction.id,
          nftId,
          mintAddress: nft.mint_address,
          type,
          startingPrice,
          reservePrice,
          duration,
          status: 'active',
          startsAt: now.toISOString(),
          endsAt: new Date(now.getTime() + duration * 1000).toISOString(),
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to create auction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
