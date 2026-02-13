import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Cancel Multisig Transaction',
  description: 'Cancel a pending multisig transaction (proposer only)',
  method: 'POST',
  async handle(request: RequestInstance) {
    const body = await request.json()
    const { multisigTransactionId, walletAddress } = body

    if (!multisigTransactionId || !walletAddress) {
      return response.json({ error: 'multisigTransactionId and walletAddress are required' }, 400)
    }

    try {
      const tx = await db
        .selectFrom('multisig_transactions' as any)
        .selectAll()
        .where('uuid', '=', multisigTransactionId)
        .executeTakeFirst()

      if (!tx) {
        return response.notFound({ error: 'Transaction not found' })
      }

      const txAny = tx as any
      if (txAny.proposer_wallet !== walletAddress) {
        return response.json({ error: 'Only the proposer can cancel this transaction' }, 403)
      }

      if (txAny.status === 'executed') {
        return response.json({ error: 'Cannot cancel an executed transaction' }, 400)
      }

      await db
        .updateTable('multisig_transactions' as any)
        .set({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        } as any)
        .where('id', '=', txAny.id)
        .execute()

      return response.json({
        success: true,
        status: 'cancelled',
      })
    } catch (error) {
      return response.json({
        error: 'Failed to cancel transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
