import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify PriorityFeeService structure
// ============================================

const servicePath = 'app/Services/PriorityFeeService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('PriorityFeeService file structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('defines PriorityFeeService class', () => {
    expect(serviceSource).toContain('class PriorityFeeService')
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const priorityFeeService = new PriorityFeeService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default PriorityFeeService')
  })
})

describe('PriorityFeeService types', () => {
  test('defines FeeEstimate interface', () => {
    expect(serviceSource).toContain('export interface FeeEstimate')
  })

  test('FeeEstimate has three tiers', () => {
    expect(serviceSource).toContain('economy: number')
    expect(serviceSource).toContain('standard: number')
    expect(serviceSource).toContain('fast: number')
  })

  test('FeeEstimate has networkCongestion', () => {
    expect(serviceSource).toContain("networkCongestion: 'low' | 'medium' | 'high'")
  })

  test('FeeEstimate has estimatedTimes', () => {
    expect(serviceSource).toContain('estimatedTimes:')
  })

  test('defines FeeHistoryEntry interface', () => {
    expect(serviceSource).toContain('export interface FeeHistoryEntry')
  })
})

describe('PriorityFeeService methods', () => {
  test('has getRecommendedFees method', () => {
    expect(serviceSource).toContain('async getRecommendedFees(): Promise<FeeEstimate>')
  })

  test('has fetchRecentFees method', () => {
    expect(serviceSource).toContain('async fetchRecentFees(): Promise<number[]>')
  })

  test('has calculateEstimate method', () => {
    expect(serviceSource).toContain('calculateEstimate(sortedFees: number[]): FeeEstimate')
  })

  test('has classifyCongestion method', () => {
    expect(serviceSource).toContain('classifyCongestion(medianFee: number)')
  })

  test('has getEstimatedTimes method', () => {
    expect(serviceSource).toContain('getEstimatedTimes(congestion:')
  })

  test('has feeToSol method', () => {
    expect(serviceSource).toContain('feeToSol(microlamportsPerCU: number')
  })

  test('has formatFeeSol method', () => {
    expect(serviceSource).toContain('formatFeeSol(microlamportsPerCU: number')
  })
})

describe('PriorityFeeService RPC integration', () => {
  test('uses getRecentPrioritizationFees RPC method', () => {
    expect(serviceSource).toContain("'getRecentPrioritizationFees'")
  })

  test('uses AbortSignal timeout', () => {
    expect(serviceSource).toContain('AbortSignal.timeout(10_000)')
  })

  test('filters zero fees', () => {
    expect(serviceSource).toContain('fee > 0')
  })

  test('sorts fees ascending', () => {
    expect(serviceSource).toContain('(a: number, b: number) => a - b')
  })
})

describe('PriorityFeeService caching', () => {
  test('uses cache service', () => {
    expect(serviceSource).toContain("import { cache } from './CacheService'")
  })

  test('has cache key', () => {
    expect(serviceSource).toContain("FEE_CACHE_KEY = 'priority_fees'")
  })

  test('has 15 second cache TTL', () => {
    expect(serviceSource).toContain('FEE_CACHE_TTL = 15')
  })
})

describe('PriorityFeeService fee defaults', () => {
  test('has default economy fee', () => {
    expect(serviceSource).toContain('DEFAULT_ECONOMY_FEE = 1_000')
  })

  test('has default standard fee', () => {
    expect(serviceSource).toContain('DEFAULT_STANDARD_FEE = 5_000')
  })

  test('has default fast fee', () => {
    expect(serviceSource).toContain('DEFAULT_FAST_FEE = 50_000')
  })
})

describe('PriorityFeeService congestion thresholds', () => {
  test('has medium threshold', () => {
    expect(serviceSource).toContain('CONGESTION_MEDIUM_THRESHOLD = 10_000')
  })

  test('has high threshold', () => {
    expect(serviceSource).toContain('CONGESTION_HIGH_THRESHOLD = 50_000')
  })
})

// ============================================
// Runtime tests
// ============================================

describe('PriorityFeeService runtime - calculateEstimate', () => {
  const { priorityFeeService } = require('../../../app/Services/PriorityFeeService')

  test('returns defaults for empty fee array', () => {
    const estimate = priorityFeeService.calculateEstimate([])
    expect(estimate.economy).toBe(1_000)
    expect(estimate.standard).toBe(5_000)
    expect(estimate.fast).toBe(50_000)
    expect(estimate.networkCongestion).toBe('low')
  })

  test('calculates percentile-based estimates from sorted fees', () => {
    // 20 entries: percentiles at indices 5 (25th), 10 (50th), 15 (75th)
    const fees = Array.from({ length: 20 }, (_, i) => (i + 1) * 1000)
    const estimate = priorityFeeService.calculateEstimate(fees)
    expect(estimate.economy).toBe(6000)   // index 5
    expect(estimate.standard).toBe(11000) // index 10
    expect(estimate.fast).toBe(16000)     // index 15
  })

  test('ensures economy <= standard <= fast ordering', () => {
    const estimate = priorityFeeService.calculateEstimate([100, 200, 300, 400])
    expect(estimate.economy).toBeLessThanOrEqual(estimate.standard)
    expect(estimate.standard).toBeLessThanOrEqual(estimate.fast)
  })

  test('includes estimatedTimes', () => {
    const estimate = priorityFeeService.calculateEstimate([])
    expect(estimate.estimatedTimes).toHaveProperty('economy')
    expect(estimate.estimatedTimes).toHaveProperty('standard')
    expect(estimate.estimatedTimes).toHaveProperty('fast')
  })

  test('includes updatedAt timestamp', () => {
    const estimate = priorityFeeService.calculateEstimate([])
    expect(estimate.updatedAt).toBeGreaterThan(0)
  })
})

describe('PriorityFeeService runtime - classifyCongestion', () => {
  const { priorityFeeService } = require('../../../app/Services/PriorityFeeService')

  test('returns low for small fees', () => {
    expect(priorityFeeService.classifyCongestion(5000)).toBe('low')
  })

  test('returns medium for moderate fees', () => {
    expect(priorityFeeService.classifyCongestion(20000)).toBe('medium')
  })

  test('returns high for large fees', () => {
    expect(priorityFeeService.classifyCongestion(100000)).toBe('high')
  })

  test('returns low for zero', () => {
    expect(priorityFeeService.classifyCongestion(0)).toBe('low')
  })

  test('returns medium at threshold', () => {
    expect(priorityFeeService.classifyCongestion(10001)).toBe('medium')
  })

  test('returns high at threshold', () => {
    expect(priorityFeeService.classifyCongestion(50001)).toBe('high')
  })
})

describe('PriorityFeeService runtime - getEstimatedTimes', () => {
  const { priorityFeeService } = require('../../../app/Services/PriorityFeeService')

  test('returns times for low congestion', () => {
    const times = priorityFeeService.getEstimatedTimes('low')
    expect(times.economy).toContain('s')
    expect(times.standard).toContain('s')
    expect(times.fast).toContain('s')
  })

  test('returns times for medium congestion', () => {
    const times = priorityFeeService.getEstimatedTimes('medium')
    expect(times.economy).toBe('~30s')
    expect(times.standard).toBe('~12s')
  })

  test('returns times for high congestion', () => {
    const times = priorityFeeService.getEstimatedTimes('high')
    expect(times.economy).toBe('~60s')
    expect(times.fast).toBe('~5s')
  })
})

describe('PriorityFeeService runtime - fee conversion', () => {
  const { priorityFeeService } = require('../../../app/Services/PriorityFeeService')

  test('converts microlamports/CU to SOL', () => {
    // 5000 microlamports/CU * 200000 CU = 1,000,000,000 microlamports = 1000 lamports = 0.000001 SOL
    const sol = priorityFeeService.feeToSol(5000)
    expect(sol).toBe(0.000001)
  })

  test('supports custom compute units', () => {
    const sol = priorityFeeService.feeToSol(5000, 400000)
    expect(sol).toBe(0.000002)
  })

  test('formats fee as SOL string', () => {
    const formatted = priorityFeeService.formatFeeSol(5000)
    expect(formatted).toContain('SOL')
    expect(formatted).toMatch(/\d+\.\d+ SOL/)
  })
})
