import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { tradingRewards } from '../../Services/TradingRewardsService'

export default new Action({
  name: 'Wallet Rewards Stats',
  description: 'Get trading rewards stats for a specific wallet including tier, points breakdown, and volume',
  method: 'GET',

  async handle(request: RequestInstance) {
    const wallet = request.getParam?.('wallet') || ''

    if (!wallet) {
      return response.json({ error: 'Wallet address is required' }, 400)
    }

    const stats = await tradingRewards.getWalletStats(wallet)

    return response.json(stats)
  },
})
