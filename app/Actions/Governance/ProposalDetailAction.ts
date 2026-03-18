import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Proposal Detail',
  description: 'Get detailed view of a proposal with vote tallies',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = Number(request.getParam('id'))

    let proposal: any = null
    try {
      proposal = await db.selectFrom('proposals' as any).selectAll().where('id', '=', id).executeTakeFirst()
    }
    catch {
      return response.notFound({ error: 'Proposal not found' })
    }

    if (!proposal) {
      return response.notFound({ error: 'Proposal not found' })
    }

    let votes: any[] = []
    try {
      votes = await db.selectFrom('votes' as any).selectAll().where('proposal_id', '=', id).execute()
    }
    catch {}

    const options = JSON.parse(proposal.options || '["For","Against"]')
    const tallies = options.map((_: string, i: number) => ({
      option: options[i],
      count: votes.filter((v: any) => v.option_index === i).length,
      voters: votes.filter((v: any) => v.option_index === i).map((v: any) => ({
        wallet: v.voter_wallet,
        nftMint: v.nft_mint,
        timestamp: v.created_at,
      })),
    }))

    // Get DAO info
    let dao = null
    try {
      dao = await db.selectFrom('daos' as any).selectAll().where('id', '=', proposal.dao_id).executeTakeFirst()
    }
    catch {}

    return response.json({
      proposal,
      options,
      tallies,
      totalVotes: votes.length,
      dao: dao ? { name: (dao as any).name, quorumPct: (dao as any).quorum_pct } : null,
    })
  },
})
