import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Rarity Show',
  description: 'Fetch rarity data for a specific collection',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam('slug')

    // TODO: Replace with actual ORM query
    // const collection = await Collection.where('slug', slug).with('nfts').first()

    const collections: Record<string, any> = {
      'hoodratz': {
        id: 1,
        name: 'Hoodratz',
        slug: 'hoodratz',
        symbol: 'HDRZ',
        profileImage: '/assets/images/king-hoodrat.png',
        twitter: 'https://twitter.com/hoodratz',
        totalSupply: 10000,
        floorPrice: 0.25,
        rarityDistribution: {
          legendary: { count: 100, percentage: 1 },
          epic: { count: 500, percentage: 5 },
          rare: { count: 1500, percentage: 15 },
          uncommon: { count: 3000, percentage: 30 },
          common: { count: 4900, percentage: 49 },
        },
        attributes: [
          { name: 'Background', values: ['Gold', 'Blue', 'Red', 'Green', 'Purple'] },
          { name: 'Body', values: ['Standard', 'Gold', 'Diamond'] },
          { name: 'Accessory', values: ['Crown', 'Glasses', 'Hat', 'None'] },
        ],
        topRanked: [
          { id: 1, name: 'King Hoodrat', rank: 1, rarity: 'Legendary', imageUrl: '/assets/images/king-hoodrat.png' },
          { id: 2, name: 'Hoodie #1234', rank: 2, rarity: 'Epic', imageUrl: '/assets/images/hoodie.png' },
          { id: 3, name: 'Anonymouse', rank: 3, rarity: 'Rare', imageUrl: '/assets/images/anonymouse.png' },
        ],
      },
    }

    const collection = collections[slug as string]

    if (!collection) {
      return response.json({ error: 'Collection not found' }, 404)
    }

    return response.json({ collection })
  },
})
