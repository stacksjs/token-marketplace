import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Collection Show',
  description: 'Fetch a single collection by slug',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')

    // TODO: Replace with actual ORM query
    // const collection = await Collection.where('slug', slug).first()

    const collections: Record<string, any> = {
      'hoodratz': {
        id: 1,
        name: 'Hoodratz',
        slug: 'hoodratz',
        description: 'A collection of 10,000 unique Hoodratz NFTs living on the blockchain.',
        imageUrl: '/assets/images/king-hoodrat.png',
        heroImageUrl: '/assets/images/king-hoodrat.png',
        isLive: true,
        isFeatured: false,
        isMinting: true,
        website: 'https://hoodratz.nakednfts.io/',
        nfts: [
          { id: 1, name: 'King Hoodrat', imageUrl: '/assets/images/king-hoodrat.png', price: 0.5 },
          { id: 2, name: 'Hoodie #1234', imageUrl: '/assets/images/hoodie.png', price: 0.3 },
        ],
      },
      'crypto-punks': {
        id: 2,
        name: 'Crypto Punks',
        slug: 'crypto-punks',
        description: 'The original pixel art NFT collection that started it all.',
        imageUrl: '/assets/images/hoodie.png',
        heroImageUrl: '/assets/images/anonymouse.png',
        isLive: true,
        isFeatured: true,
        isMinting: false,
        website: 'https://cryptopunks.app/',
        nfts: [],
      },
    }

    const collection = collections[slug as string]

    if (!collection) {
      return response.json({ error: 'Collection not found' }, 404)
    }

    return response.json({ collection })
  },
})
