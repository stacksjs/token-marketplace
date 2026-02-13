import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { PlatformFeeService } from '../../Services/PlatformFeeService'

export default new Action({
  name: 'Platform Fee Stats',
  description: 'Get platform fee statistics',
  method: 'GET',
  async handle(request: RequestInstance) {
    try {
      const totals = await PlatformFeeService.getTotalFees()
      const recent = await PlatformFeeService.getRecentFees(20)
      return response.json({
        success: true,
        stats: {
          totalFees: totals.totalFees,
          totalTransactions: totals.totalTransactions,
        },
        recentFees: recent,
      })
    } catch (error) {
      return response.json({
        error: 'Failed to get fee stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
