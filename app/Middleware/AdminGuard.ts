/**
 * Admin Guard Middleware
 *
 * Verifies the authenticated user's wallet address is in the ADMIN_WALLETS
 * environment variable. Returns 403 if the wallet is not an admin.
 */

import { response } from '@stacksjs/router'
import { db } from '@stacksjs/database'
import tokensConfig from '../../config/tokens'

interface JwtPayload {
  sub: number
  wallet: string
  iat: number
  exp: number
}

/**
 * Verify a JWT token and return the payload.
 * Mirrors the logic in WalletVerifyAction.
 */
async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null

    const payload = JSON.parse(atob(payloadB64)) as JwtPayload

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  }
  catch {
    return null
  }
}

/**
 * Check if a request is from an admin wallet.
 * Returns null if authorized, or an error Response if not.
 */
export async function requireAdmin(request: any): Promise<Response | null> {
  const authHeader = request.headers?.get?.('Authorization')
    || request.headers?.authorization
    || ''

  const token = String(authHeader).replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return response.json({ error: 'Authentication required' }, 401)
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return response.json({ error: 'Invalid or expired token' }, 401)
  }

  const adminWallets = tokensConfig.admin?.walletAddresses || []
  if (adminWallets.length === 0) {
    return response.json({ error: 'No admin wallets configured' }, 403)
  }

  // Check wallet from JWT payload
  if (payload.wallet && adminWallets.includes(payload.wallet)) {
    return null // Authorized
  }

  // Fallback: look up user by ID and check wallet_address
  try {
    const user = await db
      .selectFrom('users')
      .select(['id', 'wallet_address'])
      .where('id', '=', payload.sub)
      .executeTakeFirst()

    if (user?.wallet_address && adminWallets.includes(String(user.wallet_address))) {
      return null // Authorized
    }
  }
  catch {
    // DB lookup failed
  }

  return response.json({ error: 'Admin access required' }, 403)
}

/**
 * Check if a wallet address is an admin.
 */
export function isAdminWallet(wallet: string): boolean {
  const adminWallets = tokensConfig.admin?.walletAddresses || []
  return adminWallets.includes(wallet)
}
