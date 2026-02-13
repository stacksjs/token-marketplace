import { Action } from '@stacksjs/actions'
import { db } from '@stacksjs/database'
import { response } from '@stacksjs/router'
import type { RequestInstance } from '@stacksjs/types'

export default new Action({
  name: 'Wallet Verify',
  description: 'Verify wallet signature and issue JWT token',
  method: 'POST',
  async handle(request: RequestInstance) {
    const body = await request.json()
    const { walletAddress, signature, nonce } = body

    if (!walletAddress || !signature || !nonce) {
      return response.json({ error: 'walletAddress, signature, and nonce are required' }, 400)
    }

    try {
      const user = await db
        .selectFrom('users')
        .selectAll()
        .where('wallet_address' as any, '=', walletAddress)
        .executeTakeFirst()

      if (!user) {
        return response.json({ error: 'User not found. Please request a challenge first.' }, 404)
      }

      const userAny = user as any
      if (userAny.nonce !== nonce) {
        return response.json({ error: 'Invalid nonce' }, 400)
      }

      if (userAny.nonce_expires_at && new Date(userAny.nonce_expires_at) < new Date()) {
        return response.json({ error: 'Nonce has expired. Please request a new challenge.' }, 400)
      }

      // Verify ed25519 signature
      const message = `Sign this message to verify your wallet ownership for Naked NFTs: ${nonce}`
      const verified = await verifyWalletSignature(walletAddress, signature, message)

      if (!verified) {
        return response.json({ error: 'Invalid signature' }, 401)
      }

      // Clear nonce
      await db
        .updateTable('users')
        .set({
          nonce: null,
          nonce_expires_at: null,
          updated_at: new Date().toISOString(),
        } as any)
        .where('id', '=', user.id)
        .execute()

      // Generate JWT token using Bun's built-in crypto
      const payload = {
        sub: user.id,
        wallet: walletAddress,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      }

      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
      const body64 = btoa(JSON.stringify(payload)).replace(/=/g, '')
      const secret = (typeof Bun !== 'undefined' ? Bun.env : process.env).APP_KEY || 'default-secret'
      const hasher = new Bun.CryptoHasher('sha256', secret)
      hasher.update(`${header}.${body64}`)
      const sig = Buffer.from(hasher.digest()).toString('base64url')
      const token = `${header}.${body64}.${sig}`

      return response.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          walletAddress,
        },
      })
    } catch (error) {
      return response.json({
        error: 'Failed to verify wallet',
        details: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  },
})

async function verifyWalletSignature(walletAddress: string, signature: string, message: string): Promise<boolean> {
  try {
    // In mock/dev mode, accept any signature
    const mockMode = (typeof Bun !== 'undefined' ? Bun.env : process.env).TOKENS_MOCK_MODE
    if (mockMode === 'true' || mockMode === '1') {
      return true
    }

    // Decode base58 public key from wallet address
    const pubKeyBytes = base58Decode(walletAddress)
    const messageBytes = new TextEncoder().encode(message)
    const sigBytes = Buffer.from(signature, 'base64')

    // Use Web Crypto API for ed25519 verification
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      pubKeyBytes,
      { name: 'Ed25519' },
      false,
      ['verify'],
    )
    return await crypto.subtle.verify('Ed25519', cryptoKey, sigBytes, messageBytes)
  } catch {
    return false
  }
}

function base58Decode(str: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const BASE = BigInt(58)
  let num = BigInt(0)
  for (const char of str) {
    const index = ALPHABET.indexOf(char)
    if (index === -1) throw new Error('Invalid base58 character')
    num = num * BASE + BigInt(index)
  }
  const bytes: number[] = []
  while (num > BigInt(0)) {
    bytes.unshift(Number(num % BigInt(256)))
    num = num / BigInt(256)
  }
  for (const char of str) {
    if (char === '1') bytes.unshift(0)
    else break
  }
  return new Uint8Array(bytes)
}
