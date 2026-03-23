import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { tensorAggregator } from '../../Services/TensorAggregatorService'

export default new Action({
  name: 'Aggregated Listings',
  description: 'Fetch listings for an NFT from all marketplaces including Tensor',
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

    // Fetch Tensor listings for the same mint
    const mintAddress = (nft as any).mint_address
    if (mintAddress && tensorAggregator.hasApiKey()) {
      try {
        const collectionId = (nft as any).collection_id
        if (collectionId) {
          const collection = await db
            .selectFrom('collections')
            .select('slug')
            .where('id', '=', collectionId)
            .executeTakeFirst()

          if (collection?.slug) {
            const tensorListings = await tensorAggregator.getCollectionListings(collection.slug, { limit: 10 })
            const matchingListing = tensorListings.find(l => l.mint === mintAddress)
            if (matchingListing) {
              listings.push({
                marketplace: 'tensor',
                price: matchingListing.price,
                url: `https://www.tensor.trade/item/${mintAddress}`,
                source: 'tensor',
              })
            }
          }
        }
      }
      catch {
        // Tensor API unavailable, continue with local listings only
      }
    }

    // Sort by price ascending to show best price first
    listings.sort((a, b) => a.price - b.price)

    const bestPrice = listings.length > 0 ? listings[0] : null

    return response.json({
      nftId: id,
      mint: mintAddress,
      listings,
      bestPrice,
      totalListings: listings.length,
    })
  },
})
