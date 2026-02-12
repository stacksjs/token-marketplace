import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Marketplace Profile',
  description: 'Fetch profile data for a wallet address',
  method: 'GET',

  async handle(request: RequestInstance) {
    const walletAddress = request.getParam('walletAddress')

    if (!walletAddress) {
      return response.json({ error: 'Wallet address required' }, 400)
    }

    // Owned NFTs
    let ownedNfts: any[] = []
    try {
      ownedNfts = await db
        .selectFrom('nfts')
        .selectAll()
        .where('owner_wallet_address', '=', walletAddress)
        .execute()
    } catch (_) {}

    // Active listings (owned + for sale)
    let listings: any[] = []
    try {
      listings = await db
        .selectFrom('nfts')
        .selectAll()
        .where('owner_wallet_address', '=', walletAddress)
        .where('is_for_sale', '=', 1)
        .execute()
    } catch (_) {}

    // Sent offers
    let sentOffers: any[] = []
    try {
      sentOffers = await db
        .selectFrom('offers')
        .selectAll()
        .where('bidder_address', '=', walletAddress)
        .orderBy('created_at', 'desc')
        .execute()
    } catch (_) {}

    // Received offers (offers on NFTs the user owns)
    let receivedOffers: any[] = []
    try {
      const ownedIds = ownedNfts.map((n) => n.id)
      if (ownedIds.length > 0) {
        receivedOffers = await db
          .selectFrom('offers')
          .selectAll()
          .where('nft_id', 'in', ownedIds)
          .where('status', '=', 'pending')
          .orderBy('created_at', 'desc')
          .execute()
      }
    } catch (_) {}

    // Active auctions (created by user)
    let auctions: any[] = []
    try {
      auctions = await db
        .selectFrom('auctions')
        .selectAll()
        .where('seller_address', '=', walletAddress)
        .orderBy('created_at', 'desc')
        .execute()
    } catch (_) {}

    // Transaction history (mints)
    let transactions: any[] = []
    try {
      transactions = await db
        .selectFrom('mint_transactions')
        .selectAll()
        .where('wallet_address', '=', walletAddress)
        .orderBy('created_at', 'desc')
        .limit(50)
        .execute()
    } catch (_) {}

    return response.json({
      walletAddress,
      ownedNfts,
      listings,
      sentOffers,
      receivedOffers,
      auctions,
      transactions,
    })
  },
})
