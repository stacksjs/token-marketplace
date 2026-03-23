import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { launchpadService } from '../../Services/LaunchpadService'

export default new Action({
  name: 'Creator Dashboard',
  description: 'Get creator dashboard data for a collection including mint progress, revenue, and holder analytics',
  method: 'GET',

  async handle(request: RequestInstance) {
    const slug = request.getParam?.('slug') || ''

    if (!slug) {
      // Return launchpad stats
      const stats = await launchpadService.getStats()
      return response.json({ stats })
    }

    const dashboard = await launchpadService.getCreatorDashboard(slug)

    if (!dashboard) {
      return response.json({ error: 'Collection not found' }, 404)
    }

    return response.json(dashboard)
  },
})
