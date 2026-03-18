import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Aggregated Listings',
  description: 'Fetch listings for an NFT from all marketplaces',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = Number(request.getParam('id'))

    const nft = await db
      .selectFrom('nfts')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()

    if (!nft) {
      return response.notFound({ error: 'NFT not found' })
    }

    const listings: any[] = []

    // Local listing
    if ((nft as any).is_for_sale || (nft as any).listing_price) {
      const price = (nft as any).listing_price
        ? Number((nft as any).listing_price) / 1e9
        : Number((nft as any).price || 0)

      listings.push({
        marketplace: 'hoodies',
        price,
        url: `/nfts/${nft.id}`,
        source: 'local',
      })
    }

    // In production, fetch from external marketplaces via ts-tokens/marketplace
    // Mock external listings for structure
    // const externalListings = await tokenService.getExternalListings(nft.mint_address)

    // Sort by price ascending to show best price first
    listings.sort((a, b) => a.price - b.price)

    const bestPrice = listings.length > 0 ? listings[0] : null

    return response.json({
      nftId: id,
      mint: (nft as any).mint_address,
      listings,
      bestPrice,
      totalListings: listings.length,
    })
  },
})
