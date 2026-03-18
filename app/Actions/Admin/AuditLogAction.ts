import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { paginate } from '../helpers'

export default new Action({
  name: 'Audit Log',
  description: 'View admin audit log of privileged actions',
  method: 'GET',

  async handle(request: RequestInstance) {
    const page = Number(request.getParam('page')) || 1
    const limit = Number(request.getParam('limit')) || 50
    const action = request.getParam('action') // filter by action type

    try {
      let logs = await db
        .selectFrom('audit_logs' as any)
        .selectAll()
        .execute()

      if (action) {
        logs = (logs as any[]).filter((l: any) => l.action === action)
      }

      // Sort by most recent
      (logs as any[]).sort((a: any, b: any) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      )

      return response.json(paginate(logs as any[], page, limit))
    }
    catch {
      return response.json(paginate([], page, limit))
    }
  },
})
