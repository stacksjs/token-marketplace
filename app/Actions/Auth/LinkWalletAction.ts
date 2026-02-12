import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Link Wallet',
  description: 'Associate a wallet address with the authenticated user',
  method: 'POST',
  middleware: 'auth',

  async handle(request: RequestInstance) {
    const walletAddress = request.get('walletAddress')

    if (!walletAddress) {
      return response.json({ error: 'Wallet address is required' }, 400)
    }

    const user = request.user
    if (!user?.id) {
      return response.json({ error: 'Authentication required' }, 401)
    }

    try {
      await db
        .updateTable('users')
        .set({ wallet_address: walletAddress })
        .where('id', '=', user.id)
        .execute()

      return response.json({ success: true, walletAddress })
    } catch (err) {
      return response.json({ error: 'Failed to link wallet' }, 500)
    }
  },
})
