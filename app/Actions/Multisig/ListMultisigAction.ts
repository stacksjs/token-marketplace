import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'List Multisig Accounts',
  description: 'List multisig accounts for a wallet address',
  method: 'GET',
  async handle(request: RequestInstance) {
    const walletAddress = request.getParam('walletAddress') || request.getQuery('walletAddress')

    if (!walletAddress) {
      return response.json({ error: 'walletAddress query parameter is required' }, 400)
    }

    try {
      const accounts = await db
        .selectFrom('multisig_accounts' as any)
        .selectAll()
        .where('status', '=', 'active')
        .execute()

      const filtered = accounts.filter((acc: any) => {
        try {
          const signers = JSON.parse(acc.signers)
          return Array.isArray(signers) && signers.includes(walletAddress)
        } catch { return false }
      })

      return response.json({
        success: true,
        accounts: filtered.map((acc: any) => ({
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
        })),
      })
    } catch (error) {
      return response.json({
        error: 'Failed to list multisig accounts',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
