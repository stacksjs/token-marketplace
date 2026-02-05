import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'

export default new Action({
  name: 'Collection Index',
  description: 'Fetch all collections',
  method: 'GET',

  async handle() {
    // TODO: Replace with actual ORM query
    // const collections = await Collection.all()

    const collections = [
      {
        id: 1,
        name: 'Hoodratz',
        slug: 'hoodratz',
        description: 'A collection of 10,000 unique Hoodratz NFTs',
        imageUrl: '/assets/images/king-hoodrat.png',
        heroImageUrl: '/assets/images/king-hoodrat.png',
        isLive: true,
        isFeatured: false,
        isMinting: true,
      },
      {
        id: 2,
        name: 'Crypto Punks',
        slug: 'crypto-punks',
        description: 'The original pixel art NFT collection',
        imageUrl: '/assets/images/hoodie.png',
        heroImageUrl: '/assets/images/anonymouse.png',
        isLive: true,
        isFeatured: true,
        isMinting: false,
      },
      {
        id: 3,
        name: 'Bored Apes',
        slug: 'bored-apes',
        description: 'A collection of 10,000 unique Bored Apes',
        imageUrl: '/assets/images/anonymouse.png',
        heroImageUrl: '/assets/images/hoodie.png',
        isLive: true,
        isFeatured: false,
        isMinting: false,
      },
    ]

    return response.json({ collections })
  },
})
