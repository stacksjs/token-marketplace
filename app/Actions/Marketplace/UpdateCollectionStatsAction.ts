import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Update Collection Stats',
  description: 'Recalculate collection statistics (floor price, volume, holders)',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = await request.json()
    const { collectionId } = body

    if (!collectionId) {
      return response.json({ error: 'collectionId is required' }, 400)
    }

    const nfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('collection_id', '=', Number(collectionId))
      .execute()

    // Floor price = lowest listing_price among for-sale NFTs
    const listedNfts = nfts.filter((n: any) => n.is_for_sale && n.listing_price)
    const floorPrice = listedNfts.length > 0
      ? Math.min(...listedNfts.map((n: any) => Number(n.listing_price))) / 1e9
      : null

    // Unique holders
    const holders = new Set(
      nfts.map((n: any) => n.owner_wallet_address).filter(Boolean)
    )

    // Volume traded = sum of accepted offer amounts (approximation)
    let volumeTraded = 0
    try {
      const nftIds = nfts.map(n => n.id)
      if (nftIds.length > 0) {
        const acceptedOffers = await db
          .selectFrom('offers')
          .selectAll()
          .where('status', '=', 'accepted')
          .execute()
        const collectionOffers = acceptedOffers.filter(
          (o: any) => nftIds.includes(Number(o.nft_id))
        )
        volumeTraded = collectionOffers.reduce(
          (sum, o: any) => sum + (Number(o.amount) || 0), 0
        ) / 1e9
      }
    } catch (_) {}

    // Update collection
    await db
      .updateTable('collections')
      .set({
        floor_price: floorPrice,
        volume_traded: volumeTraded,
        unique_holders: holders.size,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', Number(collectionId))
      .execute()

    return response.json({
      success: true,
      stats: { floorPrice, volumeTraded, uniqueHolders: holders.size },
    })
  },
})
