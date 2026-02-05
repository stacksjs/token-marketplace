import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'

export default new Action({
  name: 'NFT Index',
  description: 'Fetch all available NFTs',
  method: 'GET',

  async handle() {
    const nfts = await db
      .selectFrom('nfts')
      .selectAll()
      .where('is_for_sale', '=', 1)
      .orWhere('is_minting', '=', 1)
      .execute()

    return response.json({ nfts })
  },
})
