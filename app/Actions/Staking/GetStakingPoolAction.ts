import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { paginate } from '../helpers'

export default new Action({
  name: 'Get Staking Pools',
  description: 'List staking pools or get a specific pool detail',
  method: 'GET',

  async handle(request: RequestInstance) {
    const id = request.getParam('id')
    const page = Number(request.getParam('page')) || 1
    const limit = Number(request.getParam('limit')) || 20
    const walletAddress = request.getParam('wallet')

    try {
      if (id) {
        // Single pool detail
        const pool = await db
          .selectFrom('staking_pools' as any)
          .selectAll()
          .where('id', '=', Number(id))
          .executeTakeFirst()

        if (!pool) {
          return response.notFound({ error: 'Pool not found' })
        }

        // Get collection info
        let collection = null
        if ((pool as any).collection_id) {
          collection = await db
            .selectFrom('collections')
            .selectAll()
            .where('id', '=', (pool as any).collection_id)
            .executeTakeFirst()
        }

        // Get user's stakes if wallet provided
        let userStakes: any[] = []
        let pendingRewards = 0
        if (walletAddress) {
          const stakes = await db
            .selectFrom('stakes' as any)
            .selectAll()
            .where('pool_id', '=', Number(id))
            .where('staker_wallet', '=', walletAddress)
            .where('status', '=', 'staked')
            .execute()

          const rewardRate = Number((pool as any).reward_rate || 0)
          userStakes = stakes.map((s: any) => {
            const daysStaked = (Date.now() - new Date(s.staked_at).getTime()) / (24 * 3600000)
            const earned = daysStaked * rewardRate
            const pending = earned - Number(s.claimed_rewards || 0)
            return { ...s, pendingRewards: Math.max(0, pending) }
          })
          pendingRewards = userStakes.reduce((sum, s) => sum + s.pendingRewards, 0)
        }

        return response.json({
          pool,
          collection: collection ? { name: (collection as any).name, slug: (collection as any).slug, image: (collection as any).image_url } : null,
          userStakes,
          pendingRewards: Number(pendingRewards.toFixed(6)),
        })
      }

      // List all pools
      const pools = await db
        .selectFrom('staking_pools' as any)
        .selectAll()
        .execute()

      const enriched = await Promise.all((pools as any[]).map(async (pool) => {
        let collection = null
        if (pool.collection_id) {
          collection = await db
            .selectFrom('collections')
            .selectAll()
            .where('id', '=', pool.collection_id)
            .executeTakeFirst()
        }
        return {
          ...pool,
          collection: collection ? { name: (collection as any).name, slug: (collection as any).slug } : null,
        }
      }))

      return response.json(paginate(enriched, page, limit))
    }
    catch {
      return response.json(paginate([], page, limit))
    }
  },
})
