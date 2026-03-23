import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { tradingRewards } from '../../Services/TradingRewardsService'

export default new Action({
  name: 'Trading Rewards Leaderboard',
  description: 'Get the trading rewards leaderboard for the current or specified season',
  method: 'GET',

  async handle(request: RequestInstance) {
    const params = request.all?.() || {}
    const season = params.season as string || undefined
    const limit = Math.min(Number(params.limit) || 50, 200)

    const leaderboard = await tradingRewards.getLeaderboard(season, limit)

    return response.json({
      season: season || tradingRewards.getCurrentSeason(),
      leaderboard,
      tiers: tradingRewards.getTiers(),
    })
  },
})
