import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { requireAdmin } from '../../Middleware/AdminGuard'

export default new Action({
  name: 'Verify Admin Access',
  description: 'Check if the current authenticated user has admin privileges',
  method: 'GET',

  async handle(request: RequestInstance) {
    const denied = await requireAdmin(request)
    if (denied) return denied

    return response.json({ admin: true })
  },
})
