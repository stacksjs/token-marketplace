import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'

export default new Action({
  name: 'NFT Index',
  description: 'Fetch all available NFTs',
  method: 'GET',

  async handle() {
    // TODO: Replace with actual ORM query
    // const nfts = await Nft.where('isForSale', true).get()

    const nfts = [
      {
        id: 1,
        name: 'King Hoodrat',
        tokenId: 'HR001',
        description: 'The legendary King of Hoodratz',
        imageUrl: '/assets/images/king-hoodrat.png',
        price: 0.5,
        isForSale: true,
        isMinting: true,
        mintUrl: 'https://hoodratz.nakednfts.io/',
        collectionId: 1,
        collectionName: 'Hoodratz',
        rarity: 'Legendary',
      },
      {
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
        rarity: 'Rare',
      },
      {
        id: 3,
        name: 'Anonymouse',
        tokenId: 'HR5678',
        description: 'The mysterious Anonymouse',
        imageUrl: '/assets/images/anonymouse.png',
        price: 0.25,
        isForSale: true,
        isMinting: true,
        mintUrl: 'https://hoodratz.nakednfts.io/',
        collectionId: 1,
        collectionName: 'Hoodratz',
        rarity: 'Epic',
      },
    ]

    return response.json({ nfts })
  },
})
