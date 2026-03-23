import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { priorityFeeService } from '../../Services/PriorityFeeService'

export default new Action({
  name: 'Fee Estimate',
  description: 'Get current priority fee estimates for Solana transactions with three tiers and congestion indicator',
  method: 'GET',

  async handle(_request: RequestInstance) {
    try {
      const estimate = await priorityFeeService.getRecommendedFees()

      return response.json({
        economy: estimate.economy,
        standard: estimate.standard,
        fast: estimate.fast,
        networkCongestion: estimate.networkCongestion,
        estimatedTimes: estimate.estimatedTimes,
        display: {
          economy: priorityFeeService.formatFeeSol(estimate.economy),
          standard: priorityFeeService.formatFeeSol(estimate.standard),
          fast: priorityFeeService.formatFeeSol(estimate.fast),
        },
        updatedAt: estimate.updatedAt,
      })
    }
    catch {
      return response.json({ error: 'Failed to fetch fee estimates' }, 500)
    }
  },
})
