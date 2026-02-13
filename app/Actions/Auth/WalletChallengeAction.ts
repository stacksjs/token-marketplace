import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Wallet Challenge',
  description: 'Generate a nonce challenge for wallet-based authentication',
  method: 'POST',
  async handle(request: RequestInstance) {
    const body = await request.json()
    const { walletAddress } = body

    if (!walletAddress) {
      return response.json({ error: 'walletAddress is required' }, 400)
    }

    if (walletAddress.length < 32 || walletAddress.length > 44) {
      return response.json({ error: 'Invalid wallet address format' }, 400)
    }

    const nonce = crypto.randomUUID()
    const nonceExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const message = `Sign this message to verify your wallet ownership for Naked NFTs: ${nonce}`

    try {
      const existingUser = await db
        .selectFrom('users')
        .selectAll()
        .where('wallet_address' as any, '=', walletAddress)
        .executeTakeFirst()

      if (existingUser) {
        await db
          .updateTable('users')
          .set({
            nonce,
            nonce_expires_at: nonceExpiresAt,
            updated_at: new Date().toISOString(),
          } as any)
          .where('id', '=', existingUser.id)
          .execute()
      } else {
        const shortAddr = walletAddress.slice(0, 8)
        await db
          .insertInto('users')
          .values({
            name: `Wallet_${shortAddr}`,
            wallet_address: walletAddress,
            auth_type: 'wallet',
            nonce,
            nonce_expires_at: nonceExpiresAt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any)
          .execute()
      }

      return response.json({
        success: true,
        nonce,
        message,
      })
    } catch (error) {
      return response.json({
        error: 'Failed to generate challenge',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})
