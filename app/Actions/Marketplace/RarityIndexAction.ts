import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'

export default new Action({
  name: 'Rarity Index',
  description: 'Fetch all collections with rarity data',
  method: 'GET',

  async handle() {
    // TODO: Replace with actual ORM query
    // const collections = await Collection.with('nfts').get()

    const collections = [
      {
        id: 1,
        name: 'Hoodratz',
        slug: 'hoodratz',
        symbol: 'HDRZ',
        profileImage: '/assets/images/king-hoodrat.png',
        twitter: 'https://twitter.com/hoodratz',
        totalSupply: 10000,
        floorPrice: 0.25,
      },
      {
        id: 2,
        name: 'Crypto Punks',
        slug: 'crypto-punks',
        symbol: 'PUNK',
        profileImage: '/assets/images/hoodie.png',
        discord: 'https://discord.gg/cryptopunks',
        totalSupply: 10000,
        floorPrice: 50.0,
      },
      {
        id: 3,
        name: 'Bored Apes',
        slug: 'bored-apes',
        symbol: 'BAYC',
        profileImage: '/assets/images/anonymouse.png',
        website: 'https://boredapeyachtclub.com',
        totalSupply: 10000,
        floorPrice: 30.0,
      },
    ]

    return response.json({ collections })
  },
})
