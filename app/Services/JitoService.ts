/**
 * Jito Service
 *
 * Submits transactions via Jito block engine for MEV protection.
 * High-value trades are bundled and submitted privately to prevent
 * sandwich attacks and front-running.
 *
 * Features:
 *   - Bundle submission via Jito block engine API
 *   - Bundle status tracking
 *   - Automatic tip account selection
 *   - Configurable trade value threshold for Jito usage
 *   - Mainnet and devnet support
 */

import { cache } from './CacheService'

// ============================================
// Types
// ============================================

export interface BundleResult {
  bundleId: string
  method: 'jito'
  submittedAt: number
}

export interface BundleStatus {
  bundleId: string
  status: 'pending' | 'landed' | 'failed' | 'unknown'
  slot?: number
  confirmationStatus?: string
  err?: unknown
}

export interface JitoServiceStats {
  bundlesSubmitted: number
  bundlesLanded: number
  bundlesFailed: number
  blockEngineUrl: string
  jitoThresholdSol: number
}

// ============================================
// Constants
// ============================================

const MAINNET_BLOCK_ENGINE = 'https://mainnet.block-engine.jito.wtf'
const DEFAULT_TIP_LAMPORTS = 10_000 // 0.00001 SOL
const DEFAULT_JITO_THRESHOLD_SOL = 10
const TIP_ACCOUNTS_CACHE_KEY = 'jito_tip_accounts'
const TIP_ACCOUNTS_CACHE_TTL = 300 // 5 minutes

// ============================================
// JitoService
// ============================================

class JitoService {
  private blockEngineUrl: string
  private tipLamports: number
  private jitoThresholdSol: number
  private bundlesSubmitted = 0
  private bundlesLanded = 0
  private bundlesFailed = 0

  constructor() {
    const env = typeof Bun !== 'undefined' ? Bun.env : process.env
    this.blockEngineUrl = env.JITO_BLOCK_ENGINE_URL || MAINNET_BLOCK_ENGINE
    this.tipLamports = Number(env.JITO_TIP_LAMPORTS) || DEFAULT_TIP_LAMPORTS
    this.jitoThresholdSol = Number(env.JITO_THRESHOLD_SOL) || DEFAULT_JITO_THRESHOLD_SOL
  }

  /**
   * Check if a trade value should use Jito MEV protection.
   */
  shouldUseJito(tradeValueSol: number): boolean {
    return tradeValueSol >= this.jitoThresholdSol
  }

  /**
   * Submit a transaction bundle via Jito block engine.
   * Transactions in a bundle are executed atomically and privately.
   *
   * @param transactions Array of base58-encoded signed transactions
   * @param tipLamports Optional tip amount (defaults to configured value)
   */
  async submitBundle(transactions: string[], tipLamports?: number): Promise<BundleResult> {
    const tip = tipLamports ?? this.tipLamports

    try {
      const response = await fetch(`${this.blockEngineUrl}/api/v1/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sendBundle',
          params: [
            transactions,
            { encoding: 'base58', tipLamports: tip },
          ],
        }),
        signal: AbortSignal.timeout(15_000),
      })

      const data = await response.json() as { result?: string, error?: unknown }

      if (data.error) {
        this.bundlesFailed++
        throw new JitoBundleError(
          `Jito bundle rejected: ${JSON.stringify(data.error)}`,
          'BUNDLE_REJECTED',
        )
      }

      if (!data.result) {
        this.bundlesFailed++
        throw new JitoBundleError('No bundle ID returned', 'NO_BUNDLE_ID')
      }

      this.bundlesSubmitted++
      return {
        bundleId: data.result,
        method: 'jito',
        submittedAt: Date.now(),
      }
    }
    catch (err) {
      if (err instanceof JitoBundleError) throw err

      this.bundlesFailed++
      throw new JitoBundleError(
        `Failed to submit bundle: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'SUBMIT_FAILED',
      )
    }
  }

  /**
   * Check the status of a submitted bundle.
   */
  async getBundleStatus(bundleId: string): Promise<BundleStatus> {
    try {
      const response = await fetch(`${this.blockEngineUrl}/api/v1/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBundleStatuses',
          params: [[bundleId]],
        }),
        signal: AbortSignal.timeout(10_000),
      })

      const data = await response.json() as { result?: { value?: Array<{ bundle_id: string, status: string, slot?: number, confirmation_status?: string, err?: unknown }> } }
      const statusEntry = data.result?.value?.[0]

      if (!statusEntry) {
        return { bundleId, status: 'unknown' }
      }

      const status = this.mapBundleStatus(statusEntry.status)
      if (status === 'landed') this.bundlesLanded++
      if (status === 'failed') this.bundlesFailed++

      return {
        bundleId,
        status,
        slot: statusEntry.slot,
        confirmationStatus: statusEntry.confirmation_status,
        err: statusEntry.err,
      }
    }
    catch {
      return { bundleId, status: 'unknown' }
    }
  }

  /**
   * Get Jito tip accounts for the current block engine region.
   */
  async getTipAccounts(): Promise<string[]> {
    const cached = cache.get<string[]>(TIP_ACCOUNTS_CACHE_KEY)
    if (cached) return cached

    try {
      const response = await fetch(`${this.blockEngineUrl}/api/v1/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTipAccounts',
          params: [],
        }),
        signal: AbortSignal.timeout(10_000),
      })

      const data = await response.json() as { result?: string[] }
      const accounts = data.result || []

      if (accounts.length > 0) {
        cache.set(TIP_ACCOUNTS_CACHE_KEY, accounts, TIP_ACCOUNTS_CACHE_TTL)
      }

      return accounts
    }
    catch {
      return []
    }
  }

  /**
   * Select a random tip account from the pool.
   */
  async selectTipAccount(): Promise<string | null> {
    const accounts = await this.getTipAccounts()
    if (accounts.length === 0) return null
    return accounts[Math.floor(Math.random() * accounts.length)]
  }

  /**
   * Map Jito API status string to our status type.
   */
  private mapBundleStatus(apiStatus: string): 'pending' | 'landed' | 'failed' | 'unknown' {
    switch (apiStatus.toLowerCase()) {
      case 'landed':
      case 'finalized':
      case 'confirmed':
        return 'landed'
      case 'failed':
      case 'invalid':
        return 'failed'
      case 'pending':
      case 'processing':
        return 'pending'
      default:
        return 'unknown'
    }
  }

  /**
   * Get service statistics.
   */
  getStats(): JitoServiceStats {
    return {
      bundlesSubmitted: this.bundlesSubmitted,
      bundlesLanded: this.bundlesLanded,
      bundlesFailed: this.bundlesFailed,
      blockEngineUrl: this.blockEngineUrl,
      jitoThresholdSol: this.jitoThresholdSol,
    }
  }

  /**
   * Reset stats (for testing).
   */
  resetStats(): void {
    this.bundlesSubmitted = 0
    this.bundlesLanded = 0
    this.bundlesFailed = 0
  }
}

// ============================================
// Error class
// ============================================

export class JitoBundleError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'JitoBundleError'
    this.code = code
  }
}

// Singleton
export const jitoService = new JitoService()
export default JitoService
