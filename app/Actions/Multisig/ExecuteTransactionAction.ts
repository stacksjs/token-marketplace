import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Execute Multisig Transaction',
  description: 'Execute a multisig transaction that has collected enough signatures',
  method: 'POST',
  async handle(request: RequestInstance) {
    const body = await request.json()
    const { multisigTransactionId } = body

    if (!multisigTransactionId) {
      return response.json({ error: 'multisigTransactionId is required' }, 400)
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
      if (txAny.status !== 'ready') {
        return response.json({ error: `Transaction status is '${txAny.status}', must be 'ready' to execute` }, 400)
      }

      const tokenService = getTokenService()
      const result = await tokenService.executeMultisigTransaction(txAny.transaction_data || '')

      await db
        .updateTable('multisig_transactions' as any)
        .set({
          status: 'executed',
          executed_signature: result.signature,
          updated_at: new Date().toISOString(),
        } as any)
        .where('id', '=', txAny.id)
        .execute()

      return response.json({
        success: true,
        status: 'executed',
        signature: result.signature,
      })
    } catch (error) {
      return response.json({
        error: 'Failed to execute multisig transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
