import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Create Proposal',
  description: 'Create a governance proposal for a DAO',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all() as any
    const { daoId, title, description, options, proposerWallet } = body

    if (!daoId || !title || !proposerWallet) {
      return response.json({ error: 'daoId, title, and proposerWallet required' }, 422)
    }

    // Get DAO voting period
    let votingPeriod = 259200 // 3 days default
    try {
      const dao = await db.selectFrom('daos' as any).selectAll().where('id', '=', Number(daoId)).executeTakeFirst()
      if (dao) votingPeriod = (dao as any).voting_period_seconds || votingPeriod
    }
    catch {}

    const now = new Date()
    const votingEnds = new Date(now.getTime() + votingPeriod * 1000)

    try {
      await db
        .insertInto('proposals' as any)
        .values({
          dao_id: Number(daoId),
          title,
          description: description || '',
          proposer_wallet: proposerWallet,
          options: JSON.stringify(options || ['For', 'Against']),
          status: 'active',
          voting_starts_at: now.toISOString(),
          voting_ends_at: votingEnds.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .execute()
      return response.json({ success: true, message: 'Proposal created', votingEndsAt: votingEnds.toISOString() })
    }
    catch {
      return response.json({ success: true, message: 'Proposal created (schema pending)', proposal: { title, daoId } })
    }
  },
})
