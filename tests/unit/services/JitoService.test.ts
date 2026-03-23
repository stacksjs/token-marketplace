import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify JitoService structure
// ============================================

const servicePath = 'app/Services/JitoService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('JitoService file structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('defines JitoService class', () => {
    expect(serviceSource).toContain('class JitoService')
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const jitoService = new JitoService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default JitoService')
  })

  test('exports JitoBundleError class', () => {
    expect(serviceSource).toContain('export class JitoBundleError')
  })
})

describe('JitoService types', () => {
  test('defines BundleResult interface', () => {
    expect(serviceSource).toContain('export interface BundleResult')
  })

  test('BundleResult has bundleId', () => {
    expect(serviceSource).toContain('bundleId: string')
  })

  test('defines BundleStatus interface', () => {
    expect(serviceSource).toContain('export interface BundleStatus')
  })

  test('BundleStatus has status types', () => {
    expect(serviceSource).toContain("'pending' | 'landed' | 'failed' | 'unknown'")
  })

  test('defines JitoServiceStats interface', () => {
    expect(serviceSource).toContain('export interface JitoServiceStats')
  })
})

describe('JitoService methods', () => {
  test('has shouldUseJito method', () => {
    expect(serviceSource).toContain('shouldUseJito(tradeValueSol: number): boolean')
  })

  test('has submitBundle method', () => {
    expect(serviceSource).toContain('async submitBundle(transactions: string[]')
  })

  test('has getBundleStatus method', () => {
    expect(serviceSource).toContain('async getBundleStatus(bundleId: string)')
  })

  test('has getTipAccounts method', () => {
    expect(serviceSource).toContain('async getTipAccounts(): Promise<string[]>')
  })

  test('has selectTipAccount method', () => {
    expect(serviceSource).toContain('async selectTipAccount(): Promise<string | null>')
  })

  test('has getStats method', () => {
    expect(serviceSource).toContain('getStats(): JitoServiceStats')
  })

  test('has resetStats method', () => {
    expect(serviceSource).toContain('resetStats(): void')
  })
})

describe('JitoService block engine configuration', () => {
  test('uses mainnet block engine URL', () => {
    expect(serviceSource).toContain("'https://mainnet.block-engine.jito.wtf'")
  })

  test('supports JITO_BLOCK_ENGINE_URL env var', () => {
    expect(serviceSource).toContain('JITO_BLOCK_ENGINE_URL')
  })

  test('supports JITO_TIP_LAMPORTS env var', () => {
    expect(serviceSource).toContain('JITO_TIP_LAMPORTS')
  })

  test('supports JITO_THRESHOLD_SOL env var', () => {
    expect(serviceSource).toContain('JITO_THRESHOLD_SOL')
  })

  test('has default tip amount', () => {
    expect(serviceSource).toContain('DEFAULT_TIP_LAMPORTS = 10_000')
  })

  test('has default trade threshold', () => {
    expect(serviceSource).toContain('DEFAULT_JITO_THRESHOLD_SOL = 10')
  })
})

describe('JitoService bundle API', () => {
  test('uses sendBundle RPC method', () => {
    expect(serviceSource).toContain("'sendBundle'")
  })

  test('uses getBundleStatuses RPC method', () => {
    expect(serviceSource).toContain("'getBundleStatuses'")
  })

  test('uses getTipAccounts RPC method', () => {
    expect(serviceSource).toContain("'getTipAccounts'")
  })

  test('sends base58 encoding', () => {
    expect(serviceSource).toContain("encoding: 'base58'")
  })

  test('uses AbortSignal timeout', () => {
    expect(serviceSource).toContain('AbortSignal.timeout(15_000)')
  })
})

describe('JitoService status mapping', () => {
  test('maps landed statuses', () => {
    expect(serviceSource).toContain("case 'landed':")
    expect(serviceSource).toContain("case 'finalized':")
    expect(serviceSource).toContain("case 'confirmed':")
  })

  test('maps failed statuses', () => {
    expect(serviceSource).toContain("case 'failed':")
    expect(serviceSource).toContain("case 'invalid':")
  })

  test('maps pending statuses', () => {
    expect(serviceSource).toContain("case 'pending':")
    expect(serviceSource).toContain("case 'processing':")
  })
})

describe('JitoService error handling', () => {
  test('tracks bundlesSubmitted counter', () => {
    expect(serviceSource).toContain('this.bundlesSubmitted++')
  })

  test('tracks bundlesFailed counter', () => {
    expect(serviceSource).toContain('this.bundlesFailed++')
  })

  test('tracks bundlesLanded counter', () => {
    expect(serviceSource).toContain('this.bundlesLanded++')
  })
})

describe('JitoBundleError', () => {
  test('extends Error', () => {
    expect(serviceSource).toContain('class JitoBundleError extends Error')
  })

  test('has code property', () => {
    expect(serviceSource).toContain('code: string')
  })

  test('uses error codes', () => {
    expect(serviceSource).toContain("'BUNDLE_REJECTED'")
    expect(serviceSource).toContain("'NO_BUNDLE_ID'")
    expect(serviceSource).toContain("'SUBMIT_FAILED'")
  })
})

describe('JitoService tip account caching', () => {
  test('caches tip accounts', () => {
    expect(serviceSource).toContain("TIP_ACCOUNTS_CACHE_KEY = 'jito_tip_accounts'")
  })

  test('has 5 minute cache TTL', () => {
    expect(serviceSource).toContain('TIP_ACCOUNTS_CACHE_TTL = 300')
  })
})

// ============================================
// Runtime tests
// ============================================

describe('JitoService runtime - shouldUseJito', () => {
  const { jitoService } = require('../../../app/Services/JitoService')

  test('returns true for trades above threshold', () => {
    expect(jitoService.shouldUseJito(15)).toBe(true)
  })

  test('returns true at exactly threshold', () => {
    expect(jitoService.shouldUseJito(10)).toBe(true)
  })

  test('returns false for trades below threshold', () => {
    expect(jitoService.shouldUseJito(5)).toBe(false)
  })

  test('returns false for zero value', () => {
    expect(jitoService.shouldUseJito(0)).toBe(false)
  })
})

describe('JitoService runtime - stats', () => {
  const { jitoService } = require('../../../app/Services/JitoService')

  test('getStats returns expected shape', () => {
    const stats = jitoService.getStats()
    expect(stats).toHaveProperty('bundlesSubmitted')
    expect(stats).toHaveProperty('bundlesLanded')
    expect(stats).toHaveProperty('bundlesFailed')
    expect(stats).toHaveProperty('blockEngineUrl')
    expect(stats).toHaveProperty('jitoThresholdSol')
  })

  test('resetStats clears counters', () => {
    jitoService.resetStats()
    const stats = jitoService.getStats()
    expect(stats.bundlesSubmitted).toBe(0)
    expect(stats.bundlesLanded).toBe(0)
    expect(stats.bundlesFailed).toBe(0)
  })
})
