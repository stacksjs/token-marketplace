import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Profile Portfolio',
  description: 'Fetch portfolio data: owned NFTs with estimated value and P&L',
  method: 'GET',

  async handle(request: RequestInstance) {
    const wallet = request.getParam('wallet')

    if (!wallet) {
      return response.json({ error: 'wallet address required' }, 422)
    }

    // Fetch owned NFTs
    const nfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('owner_wallet_address', '=', wallet)
      .execute()

    // Get collection floor prices
    const collectionIds = [...new Set(nfts.map((n: any) => n.collection_id).filter(Boolean))]
    const floorPrices: Record<number, number> = {}

    for (const cid of collectionIds) {
      const collectionNfts = await db
        .selectFrom('nfts')
        .selectAll()
        .where('collection_id', '=', cid)
        .execute()

      const listed = collectionNfts.filter((n: any) => n.is_for_sale || n.listing_price)
      const prices = listed
        .map((n: any) => n.listing_price ? Number(n.listing_price) / 1e9 : Number(n.price || 0))
        .filter((p: number) => p > 0)

      if (prices.length > 0) {
        floorPrices[cid as number] = Math.min(...prices)
      }
    }

    // Get collection names
    const collections: Record<number, any> = {}
    if (collectionIds.length > 0) {
      const colls = await db
        .selectFrom('collections')
        .selectAll()
        .where('id', 'in', collectionIds)
        .execute()
      for (const c of colls) {
        collections[c.id as number] = c
      }
    }

    // Compute portfolio
    const listedNfts = nfts.filter((n: any) => n.is_for_sale || n.listing_price)
    let estimatedValue = 0
    let totalPnl = 0

    const enrichedNfts = nfts.map((n: any) => {
      const floor = n.collection_id ? (floorPrices[n.collection_id] || 0) : 0
      const purchasePrice = n.purchase_price ? Number(n.purchase_price) / 1e9 : null
      const pnl = purchasePrice !== null && floor > 0 ? floor - purchasePrice : null

      estimatedValue += floor
      if (pnl !== null) totalPnl += pnl

      const coll = n.collection_id ? collections[n.collection_id] : null

      return {
        id: n.id,
        mint: n.mint_address,
        name: n.name,
        image: n.image_url,
        collection: coll ? { name: coll.name, slug: coll.slug } : null,
        floorPrice: floor,
        purchasePrice,
        pnl,
        pnlPct: purchasePrice && purchasePrice > 0 && pnl !== null ? Number(((pnl / purchasePrice) * 100).toFixed(1)) : null,
        isListed: !!(n.is_for_sale || n.listing_price),
        listingPrice: n.listing_price ? Number(n.listing_price) / 1e9 : null,
        rarity: n.rarity,
        rarityRank: n.rarity_rank,
      }
    })

    return response.json({
      wallet,
      ownedCount: nfts.length,
      listedCount: listedNfts.length,
      estimatedValue: Number(estimatedValue.toFixed(4)),
      totalPnl: Number(totalPnl.toFixed(4)),
      nfts: enrichedNfts,
    })
  },
})
