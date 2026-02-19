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
      const rawSentOffers = await db
        .selectFrom('offers')
        .selectAll()
        .where('buyer_wallet_address', '=', walletAddress)
        .orderBy('created_at', 'desc')
        .execute()

      // Enrich with NFT details
      const sentNftIds = [...new Set(rawSentOffers.map((o) => o.nft_id).filter(Boolean))]
      let sentNftMap: Record<string, any> = {}
      if (sentNftIds.length > 0) {
        const nfts = await db.selectFrom('nfts').selectAll().where(['id', 'in', sentNftIds]).execute()
        for (const nft of nfts) sentNftMap[String(nft.id)] = nft
      }
      sentOffers = rawSentOffers.map((o) => {
        const nft = sentNftMap[String(o.nft_id)]
        return { ...o, nft_name: nft?.name || null, nft_image_url: nft?.image_url || null }
      })
    } catch (_) {}

    // Received offers (offers on NFTs the user owns)
    let receivedOffers: any[] = []
    try {
      const ownedIds = ownedNfts.map((n) => n.id)
      if (ownedIds.length > 0) {
        const rawReceivedOffers = await db
          .selectFrom('offers')
          .selectAll()
          .where(['nft_id', 'in', ownedIds])
          .where('status', '=', 'pending')
          .orderBy('created_at', 'desc')
          .execute()

        const ownedNftMap: Record<string, any> = {}
        for (const nft of ownedNfts) ownedNftMap[String(nft.id)] = nft
        receivedOffers = rawReceivedOffers.map((o) => {
          const nft = ownedNftMap[String(o.nft_id)]
          return { ...o, nft_name: nft?.name || null, nft_image_url: nft?.image_url || null }
        })
      }
    } catch (_) {}

    // Active auctions (created by user)
    let auctions: any[] = []
    try {
      auctions = await db
        .selectFrom('auctions')
        .selectAll()
        .where('seller_wallet_address', '=', walletAddress)
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

    // Escrows (NFTs the user has in escrow)
    let escrows: any[] = []
    try {
      escrows = await db
        .selectFrom('nfts')
        .selectAll()
        .where('owner_wallet_address', '=', walletAddress)
        .where('escrow_status', '=', 'pending')
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
      escrows,
    })
  },
})
