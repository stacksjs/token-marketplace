import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Propose Multisig Transaction',
  description: 'Propose a new transaction for multisig approval',
  method: 'POST',
  async handle(request: RequestInstance) {
    const body = await request.json()
    const { multisigAccountId, transactionType, proposerWallet, description, metadata } = body

    if (!multisigAccountId || !transactionType || !proposerWallet) {
      return response.json({ error: 'multisigAccountId, transactionType, and proposerWallet are required' }, 400)
    }

    try {
      const account = await db
        .selectFrom('multisig_accounts' as any)
        .selectAll()
        .where('uuid', '=', multisigAccountId)
        .executeTakeFirst()

      if (!account) {
        return response.notFound({ error: 'Multisig account not found' })
      }

      const acc = account as any
      const signers = JSON.parse(acc.signers || '[]')
      if (!signers.includes(proposerWallet)) {
        return response.json({ error: 'Proposer is not a signer on this account' }, 403)
      }

      const txUuid = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const insertResult = await db
        .insertInto('multisig_transactions' as any)
        .values({
          uuid: txUuid,
          multisig_account_id: acc.id,
          transaction_type: transactionType,
          description: description || null,
          proposer_wallet: proposerWallet,
          status: 'pending',
          required_signatures: acc.threshold,
          collected_signatures: 1,
          transaction_data: metadata ? JSON.stringify(metadata) : null,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .execute()

      // Get the inserted transaction ID
      const tx = await db
        .selectFrom('multisig_transactions' as any)
        .selectAll()
        .where('uuid', '=', txUuid)
        .executeTakeFirst()

      // Record proposer's signature
      if (tx) {
        await db
          .insertInto('multisig_signatures' as any)
          .values({
            multisig_transaction_id: (tx as any).id,
            signer_wallet: proposerWallet,
            signature: 'proposer_auto_sign',
            signed_at: new Date().toISOString(),
          } as any)
          .execute()
      }

      // Check if already at threshold (e.g. 1-of-N)
      const status = acc.threshold <= 1 ? 'ready' : 'pending'
      if (status === 'ready' && tx) {
        await db
          .updateTable('multisig_transactions' as any)
          .set({ status: 'ready', updated_at: new Date().toISOString() } as any)
          .where('uuid', '=', txUuid)
          .execute()
      }

      return response.json({
        success: true,
        transaction: {
          uuid: txUuid,
          transactionType,
          proposerWallet,
          status,
          requiredSignatures: acc.threshold,
          collectedSignatures: 1,
          expiresAt,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to propose transaction',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
