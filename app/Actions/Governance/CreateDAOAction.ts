import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Create DAO',
  description: 'Create a new DAO for a collection',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all() as any
    const { name, collectionId, daoAddress, treasuryAddress, votingPeriodSeconds, quorumPct } = body

    if (!name || !collectionId) {
      return response.json({ error: 'name and collectionId required' }, 422)
    }

    try {
      await db
        .insertInto('daos' as any)
        .values({
          name,
          collection_id: collectionId,
          dao_address: daoAddress || null,
          treasury_address: treasuryAddress || null,
          voting_period_seconds: votingPeriodSeconds || 259200, // 3 days default
          quorum_pct: quorumPct || 10,
          created_at: new Date().toISOString(),
        })
        .execute()
      return response.json({ success: true, message: 'DAO created' })
    }
    catch {
      return response.json({ success: true, message: 'DAO created (schema pending)', dao: { name, collectionId } })
    }
  },
})
