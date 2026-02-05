import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'NFT Show',
  description: 'Fetch a single NFT by ID',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = request.getParam('id')

    const nft = await db
      .selectFrom('nfts')
      .selectAll()
      .where('id', '=', Number(id))
      .executeTakeFirst()

    if (!nft) {
      return response.notFound({ error: 'NFT not found' })
    }

    return response.json({ nft })
  },
})
