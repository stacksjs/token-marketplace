import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'NFT Show',
  description: 'Fetch a single NFT by ID',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = request.getParam('id')

    // TODO: Replace with actual ORM query
    // const nft = await Nft.find(id)

    const nfts: Record<string, any> = {
      '1': {
        id: 1,
        name: 'King Hoodrat',
        tokenId: 'HR001',
        description: 'The legendary King of Hoodratz. This rare NFT grants exclusive access to the Hoodratz kingdom.',
        imageUrl: '/assets/images/king-hoodrat.png',
        price: 0.5,
        isForSale: true,
        isMinting: true,
        mintUrl: 'https://hoodratz.nakednfts.io/',
        collectionId: 1,
        collectionName: 'Hoodratz',
        collectionSlug: 'hoodratz',
        rarity: 'Legendary',
        attributes: {
          background: 'Gold',
          body: 'Diamond',
          accessory: 'Crown',
        },
      },
      '2': {
        id: 2,
        name: 'Hoodie #1234',
        tokenId: 'HR1234',
        description: 'A rare Hoodie from the Hoodratz collection',
        imageUrl: '/assets/images/hoodie.png',
        price: 0.3,
        isForSale: true,
        isMinting: true,
        mintUrl: 'https://hoodratz.nakednfts.io/',
        collectionId: 1,
        collectionName: 'Hoodratz',
        collectionSlug: 'hoodratz',
        rarity: 'Rare',
        attributes: {
          background: 'Blue',
          body: 'Standard',
          accessory: 'Glasses',
        },
      },
    }

    const nft = nfts[id as string]

    if (!nft) {
      return response.json({ error: 'NFT not found' }, 404)
    }

    return response.json({ nft })
  },
})
