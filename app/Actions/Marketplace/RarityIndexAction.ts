import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'

export default new Action({
  name: 'Rarity Index',
  description: 'Fetch all collections with rarity data',
  method: 'GET',

  async handle() {
    const collections = await db
      .selectFrom('collections')
      .selectAll()
      .execute()

    return response.json({ collections })
  },
})
