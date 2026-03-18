import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { paginate } from '../helpers'

export default new Action({
  name: 'List Proposals',
  description: 'List governance proposals with vote tallies',
  method: 'GET',

  async handle(request: RequestInstance) {
    const page = Number(request.getParam('page')) || 1
    const limit = Number(request.getParam('limit')) || 20
    const status = request.getParam('status') // active | passed | rejected | executed | all

    try {
      let proposals: any[] = await db.selectFrom('proposals' as any).selectAll().execute()

      if (status && status !== 'all') {
        proposals = proposals.filter((p: any) => p.status === status)
      }

      // Sort: active first, then by creation date desc
      proposals.sort((a: any, b: any) => {
        if (a.status === 'active' && b.status !== 'active') return -1
        if (b.status === 'active' && a.status !== 'active') return 1
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })

      // Enrich with vote tallies
      const enriched = await Promise.all(proposals.map(async (p: any) => {
        let votes: any[] = []
        try {
          votes = await db.selectFrom('votes' as any).selectAll().where('proposal_id', '=', p.id).execute()
        }
        catch {}

        const options = JSON.parse(p.options || '["For","Against"]')
        const tallies = options.map((_: string, i: number) => ({
          option: options[i],
          count: votes.filter((v: any) => v.option_index === i).length,
        }))
        const totalVotes = votes.length

        return {
          ...p,
          options,
          tallies,
          totalVotes,
        }
      }))

      return response.json(paginate(enriched, page, limit))
    }
    catch {
      return response.json(paginate([], page, limit))
    }
  },
})
