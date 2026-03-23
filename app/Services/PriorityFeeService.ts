/**
 * Priority Fee Service
 *
 * Estimates optimal Solana priority fees based on recent block data.
 * Provides three-tier recommendations (economy/standard/fast) and
 * network congestion indicators.
 *
 * Priority fees are in microlamports per compute unit. The RPC method
 * `getRecentPrioritizationFees` returns fees from recent blocks which
 * we use to calculate percentile-based recommendations.
 */

import { cache } from './CacheService'

// ============================================
// Types
// ============================================

export interface FeeEstimate {
  economy: number
  standard: number
  fast: number
  networkCongestion: 'low' | 'medium' | 'high'
  estimatedTimes: {
    economy: string
    standard: string
    fast: string
  }
  updatedAt: number
}

export interface FeeHistoryEntry {
  slot: number
  prioritizationFee: number
}

// ============================================
// Constants
// ============================================

const DEFAULT_ECONOMY_FEE = 1_000      // 1,000 microlamports/CU
const DEFAULT_STANDARD_FEE = 5_000     // 5,000 microlamports/CU
const DEFAULT_FAST_FEE = 50_000        // 50,000 microlamports/CU

const CONGESTION_MEDIUM_THRESHOLD = 10_000
const CONGESTION_HIGH_THRESHOLD = 50_000

const FEE_CACHE_TTL = 15 // 15 seconds
const FEE_CACHE_KEY = 'priority_fees'

// ============================================
// PriorityFeeService
// ============================================

class PriorityFeeService {
  private rpcUrl: string

  constructor() {
    this.rpcUrl = (typeof Bun !== 'undefined' ? Bun.env : process.env).RPC_URL
      || 'https://api.devnet.solana.com'
  }

  /**
   * Get recommended priority fees based on recent blocks.
   * Results are cached for 15 seconds to avoid hammering RPC.
   */
  async getRecommendedFees(): Promise<FeeEstimate> {
    const cached = cache.get<FeeEstimate>(FEE_CACHE_KEY)
    if (cached) return cached

    const fees = await this.fetchRecentFees()
    const estimate = this.calculateEstimate(fees)

    cache.set(FEE_CACHE_KEY, estimate, FEE_CACHE_TTL)
    return estimate
  }

  /**
   * Fetch recent prioritization fees from RPC.
   */
  async fetchRecentFees(): Promise<number[]> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getRecentPrioritizationFees',
          params: [],
        }),
        signal: AbortSignal.timeout(10_000),
      })

      const data = await response.json() as { result?: FeeHistoryEntry[] }

      if (!data.result || !Array.isArray(data.result)) {
        return []
      }

      return data.result
        .map((entry: FeeHistoryEntry) => entry.prioritizationFee)
        .filter((fee: number) => fee > 0)
        .sort((a: number, b: number) => a - b)
    }
    catch {
      return []
    }
  }

  /**
   * Calculate fee estimates from sorted fee data.
   */
  calculateEstimate(sortedFees: number[]): FeeEstimate {
    const len = sortedFees.length

    let economy: number
    let standard: number
    let fast: number

    if (len === 0) {
      // No data — use defaults
      economy = DEFAULT_ECONOMY_FEE
      standard = DEFAULT_STANDARD_FEE
      fast = DEFAULT_FAST_FEE
    }
    else {
      economy = sortedFees[Math.floor(len * 0.25)] || DEFAULT_ECONOMY_FEE
      standard = sortedFees[Math.floor(len * 0.50)] || DEFAULT_STANDARD_FEE
      fast = sortedFees[Math.floor(len * 0.75)] || DEFAULT_FAST_FEE
    }

    // Ensure ordering: economy <= standard <= fast
    if (standard < economy) standard = economy
    if (fast < standard) fast = standard

    // Determine congestion level from median fee
    const medianFee = len > 0 ? sortedFees[Math.floor(len * 0.5)] || 0 : 0
    const networkCongestion = this.classifyCongestion(medianFee)

    return {
      economy,
      standard,
      fast,
      networkCongestion,
      estimatedTimes: this.getEstimatedTimes(networkCongestion),
      updatedAt: Date.now(),
    }
  }

  /**
   * Classify network congestion based on median priority fee.
   */
  classifyCongestion(medianFee: number): 'low' | 'medium' | 'high' {
    if (medianFee > CONGESTION_HIGH_THRESHOLD) return 'high'
    if (medianFee > CONGESTION_MEDIUM_THRESHOLD) return 'medium'
    return 'low'
  }

  /**
   * Get estimated confirmation times based on congestion level.
   */
  getEstimatedTimes(congestion: 'low' | 'medium' | 'high'): { economy: string, standard: string, fast: string } {
    switch (congestion) {
      case 'high':
        return { economy: '~60s', standard: '~20s', fast: '~5s' }
      case 'medium':
        return { economy: '~30s', standard: '~12s', fast: '~5s' }
      default:
        return { economy: '~15s', standard: '~6s', fast: '~3s' }
    }
  }

  /**
   * Convert microlamports/CU fee to SOL for display.
   * Assumes a standard transaction uses ~200,000 compute units.
   */
  feeToSol(microlamportsPerCU: number, computeUnits: number = 200_000): number {
    const totalMicrolamports = microlamportsPerCU * computeUnits
    const lamports = totalMicrolamports / 1_000_000
    const sol = lamports / 1_000_000_000
    return sol
  }

  /**
   * Format a fee as a human-readable SOL string.
   */
  formatFeeSol(microlamportsPerCU: number, computeUnits: number = 200_000): string {
    const sol = this.feeToSol(microlamportsPerCU, computeUnits)
    return `${sol.toFixed(6)} SOL`
  }
}

// Singleton
export const priorityFeeService = new PriorityFeeService()
export default PriorityFeeService
