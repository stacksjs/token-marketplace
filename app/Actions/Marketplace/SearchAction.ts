import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { paginate } from '../helpers'

export default new Action({
  name: 'Global Search',
  description: 'Search across collections, NFTs, and wallets',
  method: 'GET',

  async handle(request: RequestInstance) {
    const q = (request.getParam('q') || '').trim()
    const limit = Math.min(20, Number(request.getParam('limit')) || 10)

    if (!q || q.length < 2) {
      return response.json({ collections: [], nfts: [], wallets: [] })
    }

    const query = q.toLowerCase()

    // Search collections
    const allCollections = await db
      .selectFrom('collections')
      .selectAll()
      .execute()

    const matchedCollections = allCollections
      .filter((c: any) => (c.name || '').toLowerCase().includes(query) || (c.slug || '').includes(query))
      .slice(0, limit)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image_url,
        type: 'collection',
      }))

    // Search NFTs
    const allNfts = await db
      .selectFrom('nfts')
      .selectAll()
      .execute()

    const matchedNfts = allNfts
      .filter((n: any) =>
        (n.name || '').toLowerCase().includes(query)
        || (n.token_id || '').toString().includes(query)
        || (n.mint_address || '').toLowerCase().includes(query),
      )
      .slice(0, limit)
      .map((n: any) => ({
        id: n.id,
        name: n.name,
        image: n.image_url,
        mintAddress: n.mint_address,
        price: n.listing_price ? Number(n.listing_price) / 1e9 : null,
        type: 'nft',
      }))

    // Search wallets (check if query looks like an address)
    const wallets: any[] = []
    if (query.length >= 20) {
      // Check if any NFTs are owned by this wallet
      const owned = allNfts.filter((n: any) =>
        (n.owner_wallet_address || '').toLowerCase().includes(query),
      )
      if (owned.length > 0) {
        const ownerAddr = (owned[0] as any).owner_wallet_address
        wallets.push({
          address: ownerAddr,
          ownedCount: owned.length,
          type: 'wallet',
        })
      }
    }

    return response.json({
      query: q,
      collections: matchedCollections,
      nfts: matchedNfts,
      wallets,
    })
  },
})
