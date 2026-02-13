import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Get Multisig Account',
  description: 'Get multisig account details with pending transactions',
  method: 'GET',
  async handle(request: RequestInstance) {
    const id = request.getParam('id')

    if (!id) {
      return response.json({ error: 'id parameter is required' }, 400)
    }

    try {
      const account = await db
        .selectFrom('multisig_accounts' as any)
        .selectAll()
        .where('uuid', '=', id)
        .executeTakeFirst()

      if (!account) {
        return response.notFound({ error: 'Multisig account not found' })
      }

      const transactions = await db
        .selectFrom('multisig_transactions' as any)
        .selectAll()
        .where('multisig_account_id', '=', (account as any).id)
        .orderBy('created_at', 'desc')
        .execute()

      const txsWithSigs = await Promise.all(
        transactions.map(async (tx: any) => {
          const signatures = await db
            .selectFrom('multisig_signatures' as any)
            .selectAll()
            .where('multisig_transaction_id', '=', tx.id)
            .execute()

          return {
            uuid: tx.uuid,
            transactionType: tx.transaction_type,
            description: tx.description,
            proposerWallet: tx.proposer_wallet,
            status: tx.status,
            requiredSignatures: tx.required_signatures,
            collectedSignatures: tx.collected_signatures,
            expiresAt: tx.expires_at,
            executedSignature: tx.executed_signature,
            createdAt: tx.created_at,
            signatures: signatures.map((s: any) => ({
              signerWallet: s.signer_wallet,
              signedAt: s.signed_at,
            })),
          }
        }),
      )

      const acc = account as any
      return response.json({
        success: true,
        account: {
          uuid: acc.uuid,
          address: acc.address,
          name: acc.name,
          description: acc.description,
          threshold: acc.threshold,
          totalSigners: acc.total_signers,
          signers: JSON.parse(acc.signers || '[]'),
          authorityType: acc.authority_type,
          targetMint: acc.target_mint,
          status: acc.status,
          createdAt: acc.created_at,
        },
        transactions: txsWithSigs,
      })
    } catch (error) {
      return response.json({
        error: 'Failed to get multisig account',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
