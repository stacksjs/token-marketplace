import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'
import { getTokenService } from '../../Services/TokenService'

export default new Action({
  name: 'Create Multisig',
  description: 'Create a new multi-signature account',
  method: 'POST',
  async handle(request: RequestInstance) {
    const body = await request.json()
    const { name, signers, threshold, authorityType, targetMint, description } = body

    if (!name || !signers || !threshold) {
      return response.json({ error: 'name, signers, and threshold are required' }, 400)
    }

    if (!Array.isArray(signers) || signers.length < 2) {
      return response.json({ error: 'At least 2 signers are required' }, 400)
    }

    if (threshold < 1 || threshold > signers.length || threshold > 11) {
      return response.json({ error: 'threshold must be between 1 and the number of signers (max 11)' }, 400)
    }

    try {
      const tokenService = getTokenService()
      const result = await tokenService.createMultisig({ signers, threshold, name })

      const uuid = crypto.randomUUID()
      await db
        .insertInto('multisig_accounts' as any)
        .values({
          uuid,
          address: result.address,
          name,
          description: description || null,
          threshold,
          total_signers: signers.length,
          signers: JSON.stringify(signers),
          authority_type: authorityType || 'owner',
          target_mint: targetMint || null,
          creator_wallet: signers[0],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any)
        .execute()

      return response.json({
        success: true,
        multisig: {
          uuid,
          address: result.address,
          name,
          threshold,
          totalSigners: signers.length,
          signers,
          signature: result.signature,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to create multisig account',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
