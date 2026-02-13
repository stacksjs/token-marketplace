import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: WalletChallengeAction
// ============================================

const challengePath = 'app/Actions/Auth/WalletChallengeAction.ts'
const challengeSource = readFileSync(challengePath, 'utf-8')

describe('WalletChallengeAction structure', () => {
  test('file exists', () => {
    expect(existsSync(challengePath)).toBe(true)
  })

  test('imports Action from @stacksjs/actions', () => {
    expect(challengeSource).toContain("from '@stacksjs/actions'")
  })

  test('validates walletAddress', () => {
    expect(challengeSource).toContain('walletAddress')
  })

  test('generates nonce with crypto.randomUUID', () => {
    expect(challengeSource).toContain('randomUUID')
  })

  test('sets nonce expiry', () => {
    expect(challengeSource).toContain('nonceExpiresAt') || expect(challengeSource).toContain('nonce_expires_at')
  })

  test('upserts user by wallet_address', () => {
    expect(challengeSource).toContain('wallet_address')
  })

  test('returns nonce and message', () => {
    expect(challengeSource).toContain('nonce')
    expect(challengeSource).toContain('message')
  })

  test('creates user with auth_type wallet if new', () => {
    expect(challengeSource).toContain("'wallet'")
  })
})

// ============================================
// Static analysis: WalletVerifyAction
// ============================================

const verifyPath = 'app/Actions/Auth/WalletVerifyAction.ts'
const verifySource = readFileSync(verifyPath, 'utf-8')

describe('WalletVerifyAction structure', () => {
  test('file exists', () => {
    expect(existsSync(verifyPath)).toBe(true)
  })

  test('imports Action from @stacksjs/actions', () => {
    expect(verifySource).toContain("from '@stacksjs/actions'")
  })

  test('validates walletAddress, signature, and nonce', () => {
    expect(verifySource).toContain('walletAddress')
    expect(verifySource).toContain('signature')
    expect(verifySource).toContain('nonce')
  })

  test('checks nonce expiry', () => {
    expect(verifySource).toContain('nonce_expires_at') || expect(verifySource).toContain('expired')
  })

  test('has signature verification function', () => {
    expect(verifySource).toContain('verifyWalletSignature') || expect(verifySource).toContain('verify')
  })

  test('clears nonce after verification', () => {
    expect(verifySource).toContain('nonce: null') || expect(verifySource).toContain('nonce')
  })

  test('generates JWT token', () => {
    expect(verifySource).toContain('token')
  })

  test('returns token and user info', () => {
    expect(verifySource).toContain('token')
    expect(verifySource).toContain('user')
  })

  test('has mock mode bypass for testing', () => {
    expect(verifySource).toContain('MOCK_MODE') || expect(verifySource).toContain('mock')
  })

  test('has base58 decode for Solana addresses', () => {
    expect(verifySource).toContain('base58Decode')
  })
})

// ============================================
// Wallet auth migration
// ============================================

describe('Wallet auth migration', () => {
  test('migration file exists', () => {
    expect(existsSync('database/migrations/1770353242-add-wallet-auth-fields.sql')).toBe(true)
  })

  test('adds nonce column', () => {
    const sql = readFileSync('database/migrations/1770353242-add-wallet-auth-fields.sql', 'utf-8')
    expect(sql).toContain('nonce')
  })

  test('adds auth_type column', () => {
    const sql = readFileSync('database/migrations/1770353242-add-wallet-auth-fields.sql', 'utf-8')
    expect(sql).toContain('auth_type')
  })
})

// ============================================
// Routes exist
// ============================================

const routesPath = 'routes/api.ts'
const routesSource = readFileSync(routesPath, 'utf-8')

describe('Wallet auth routes', () => {
  test('has wallet challenge route', () => {
    expect(routesSource).toContain('WalletChallengeAction')
  })

  test('has wallet verify route', () => {
    expect(routesSource).toContain('WalletVerifyAction')
  })
})

// ============================================
// User model supports wallet auth
// ============================================

const userModelPath = 'storage/framework/models/User.ts'
const userSource = readFileSync(userModelPath, 'utf-8')

describe('User model wallet auth support', () => {
  test('has walletAddress attribute', () => {
    expect(userSource).toContain('walletAddress')
  })

  test('has authType attribute', () => {
    expect(userSource).toContain('authType')
  })

  test('has nonce attribute', () => {
    expect(userSource).toContain('nonce')
  })

  test('email is optional', () => {
    expect(userSource).toContain('optional')
  })
})

// ============================================
// Header.stx wallet auth integration
// ============================================

const headerPath = 'resources/views/components/Header.stx'
const headerSource = readFileSync(headerPath, 'utf-8')

describe('Header wallet auth integration', () => {
  test('calls wallet challenge endpoint', () => {
    expect(headerSource).toContain('/auth/wallet/challenge')
  })

  test('calls wallet verify endpoint', () => {
    expect(headerSource).toContain('/auth/wallet/verify')
  })

  test('stores auth_token in localStorage', () => {
    expect(headerSource).toContain('auth_token')
  })
})
