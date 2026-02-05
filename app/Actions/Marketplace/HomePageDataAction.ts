import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'

export default new Action({
  name: 'Home Page Data',
  description: 'Fetch all data needed for the home page (collections, NFTs, stats)',
  method: 'GET',

  async handle() {
    // TODO: Replace with actual ORM queries when migrations are run
    // const featuredCollections = await Collection.where('isFeatured', true).limit(3).get()
    // const popularCollections = await Collection.where('isLive', true).limit(3).get()
    // const availableNfts = await Nft.where('isForSale', true).limit(6).get()

    const featuredCollections = [
      {
        id: 1,
        name: 'Hoodratz',
        slug: 'hoodratz',
        description: 'A collection of 10,000 unique Hoodratz NFTs',
        imageUrl: '/assets/images/king-hoodrat.png',
        isMinting: true,
        isFeatured: false,
      },
      {
        id: 2,
        name: 'Crypto Punks',
        slug: 'crypto-punks',
        description: 'The original pixel art NFT collection',
        imageUrl: '/assets/images/hoodie.png',
        isMinting: false,
        isFeatured: true,
      },
    ]

    const popularCollections = [
      {
        id: 3,
        name: 'Bored Apes',
        slug: 'bored-apes',
        description: 'A collection of 10,000 unique Bored Apes',
        imageUrl: '/assets/images/anonymouse.png',
        website: 'https://boredapeyachtclub.com',
      },
      {
        id: 4,
        name: 'Cool Cats',
        slug: 'cool-cats',
        description: 'Cool Cats is a collection of 9,999 randomly generated cats',
        imageUrl: '/assets/images/hoodie.png',
        website: 'https://coolcatsnft.com',
      },
    ]

    const availableNfts = [
      {
        id: 1,
        name: 'King Hoodrat',
        imageUrl: '/assets/images/king-hoodrat.png',
        collectionName: 'Hoodratz',
        isMinting: true,
        mintUrl: 'https://hoodratz.nakednfts.io/',
      },
      {
        id: 2,
        name: 'Hoodie #1234',
        imageUrl: '/assets/images/hoodie.png',
        collectionName: 'Hoodratz',
        isMinting: true,
        mintUrl: 'https://hoodratz.nakednfts.io/',
      },
      {
        id: 3,
        name: 'Anonymouse',
        imageUrl: '/assets/images/anonymouse.png',
        collectionName: 'Hoodratz',
        isMinting: true,
        mintUrl: 'https://hoodratz.nakednfts.io/',
      },
    ]

    const stats = {
      totalCollections: 24,
      totalNfts: 10000,
      totalVolume: '1,234 ETH',
    }

    return response.json({
      featuredCollections,
      popularCollections,
      availableNfts,
      stats,
    })
  },
})
