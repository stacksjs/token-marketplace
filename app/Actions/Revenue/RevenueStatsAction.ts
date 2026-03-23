import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { revenueShareService } from '../../Services/RevenueShareService'

export default new Action({
  name: 'Revenue Stats',
  description: 'Get community revenue sharing statistics for a collection or globally',
  method: 'GET',

  async handle(request: RequestInstance) {
    const collectionId = request.getParam?.('collectionId') || ''
    const url = new URL(request.getUrl?.() || request.url || '', 'http://localhost')
    const period = (url.searchParams.get('period') || '7d') as '24h' | '7d' | '30d' | 'all'

    if (collectionId) {
      const stats = await revenueShareService.getRevenueStats(collectionId, period)
      const recent = await revenueShareService.getRecentDistributions(collectionId, 10)
      const config = revenueShareService.getCollectionConfig(collectionId)

      return response.json({
        collectionId,
        stats,
        recentDistributions: recent,
        config: {
          treasurySplitPct: config.treasurySplitPct,
          stakingSplitPct: config.stakingSplitPct,
        },
      })
    }

    // Global stats
    const stats = await revenueShareService.getGlobalRevenueStats(period)

    return response.json({
      global: true,
      stats,
    })
  },
})
