import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { tradingRewards } from '../../Services/TradingRewardsService'
import type { RewardAction } from '../../Services/TradingRewardsService'

const VALID_ACTIONS: RewardAction[] = ['buy', 'sell', 'list', 'offer', 'referral']

export default new Action({
  name: 'Record Trading Activity',
  description: 'Record a trading activity and award points to a wallet',
  method: 'POST',

  async handle(request: RequestInstance) {
    const body = request.all?.() || {}
    const { wallet, action, solAmount } = body

    if (!wallet || !action) {
      return response.json({ error: 'wallet and action are required' }, 400)
    }

    if (!VALID_ACTIONS.includes(action as RewardAction)) {
      return response.json({ error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}` }, 400)
    }

    try {
      const result = await tradingRewards.recordActivity(
        wallet as string,
        action as RewardAction,
        Number(solAmount) || 1,
      )

      return response.json(result)
    }
    catch (err: any) {
      return response.json({ error: err.message || 'Failed to record activity' }, 500)
    }
  },
})
