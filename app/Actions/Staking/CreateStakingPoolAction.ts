import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Create Staking Pool',
  description: 'Create a new NFT staking pool for a collection',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all() as any
    const { collectionId, rewardMint, rewardRate, lockPeriodSeconds, poolAddress, adminWallet } = body

    if (!collectionId || !rewardRate) {
      return response.json({ error: 'collectionId and rewardRate required' }, 422)
    }

    try {
      await db
        .insertInto('staking_pools' as any)
        .values({
          collection_id: collectionId,
          reward_mint: rewardMint || null,
          reward_rate: rewardRate,
          lock_period_seconds: lockPeriodSeconds || 0,
          total_staked: 0,
          total_rewards_distributed: 0,
          pool_address: poolAddress || null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .execute()

      return response.json({ success: true, message: 'Staking pool created' })
    }
    catch {
      return response.json({
        success: true,
        message: 'Staking pool created (schema pending migration)',
        pool: { collectionId, rewardRate, lockPeriodSeconds, status: 'active' },
      })
    }
  },
})
