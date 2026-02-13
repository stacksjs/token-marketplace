import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Sign Multisig Transaction',
  description: 'Add a signature to a pending multisig transaction',
  method: 'POST',
  async handle(request: RequestInstance) {
    const body = await request.json()
    const { multisigTransactionId, signerWallet, signature } = body

    if (!multisigTransactionId || !signerWallet || !signature) {
      return response.json({ error: 'multisigTransactionId, signerWallet, and signature are required' }, 400)
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
      if (txAny.status !== 'pending') {
        return response.json({ error: `Transaction is ${txAny.status}, cannot sign` }, 400)
      }

      // Verify signer is authorized
      const account = await db
        .selectFrom('multisig_accounts' as any)
        .selectAll()
        .where('id', '=', txAny.multisig_account_id)
        .executeTakeFirst()

      if (!account) {
        return response.json({ error: 'Associated multisig account not found' }, 400)
      }

      const signers = JSON.parse((account as any).signers || '[]')
      if (!signers.includes(signerWallet)) {
        return response.json({ error: 'Signer is not authorized on this multisig account' }, 403)
      }

      // Check not already signed
      const existingSig = await db
        .selectFrom('multisig_signatures' as any)
        .selectAll()
        .where('multisig_transaction_id', '=', txAny.id)
        .where('signer_wallet', '=', signerWallet)
        .executeTakeFirst()

      if (existingSig) {
        return response.json({ error: 'Signer has already signed this transaction' }, 400)
      }

      // Add signature
      await db
        .insertInto('multisig_signatures' as any)
        .values({
          multisig_transaction_id: txAny.id,
          signer_wallet: signerWallet,
          signature,
          signed_at: new Date().toISOString(),
        } as any)
        .execute()

      const newCollected = (txAny.collected_signatures || 0) + 1
      const newStatus = newCollected >= txAny.required_signatures ? 'ready' : 'pending'

      await db
        .updateTable('multisig_transactions' as any)
        .set({
          collected_signatures: newCollected,
          status: newStatus,
          updated_at: new Date().toISOString(),
        } as any)
        .where('id', '=', txAny.id)
        .execute()

      return response.json({
        success: true,
        status: newStatus,
        collectedSignatures: newCollected,
        requiredSignatures: txAny.required_signatures,
      })
    } catch (error) {
      return response.json({
        error: 'Failed to sign transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
