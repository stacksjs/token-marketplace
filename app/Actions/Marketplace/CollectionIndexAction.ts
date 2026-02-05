import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'

export default new Action({
  name: 'Collection Index',
  description: 'Fetch all collections',
  method: 'GET',

  async handle() {
    const collections = await db
      .selectFrom('collections')
      .selectAll()
      .execute()

    return response.json({ collections })
  },
})
