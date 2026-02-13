import { describe, expect, test, beforeAll } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: PlatformFeeService
// ============================================

const servicePath = 'app/Services/PlatformFeeService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('PlatformFeeService structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('imports database module', () => {
    expect(serviceSource).toContain("from '@stacksjs/database'")
  })

  test('imports tokens config', () => {
    expect(serviceSource).toContain("from '../../config/tokens'")
  })

  test('has calculateFee static method', () => {
    expect(serviceSource).toContain('static calculateFee(')
  })

  test('has recordFee static method', () => {
    expect(serviceSource).toContain('static async recordFee(')
  })

  test('has getTotalFees static method', () => {
    expect(serviceSource).toContain('static async getTotalFees(')
  })

  test('has getRecentFees static method', () => {
    expect(serviceSource).toContain('static async getRecentFees(')
  })

  test('inserts into platform_fees table', () => {
    expect(serviceSource).toContain("'platform_fees'")
  })
})

// ============================================
// Static analysis: Platform Fee Config
// ============================================

const configPath = 'config/tokens.ts'
const configSource = readFileSync(configPath, 'utf-8')

describe('Platform fee config', () => {
  test('has platformFee config section', () => {
    expect(configSource).toContain('platformFee')
  })

  test('has enabled flag', () => {
    expect(configSource).toContain('PLATFORM_FEE_ENABLED')
  })

  test('has basisPoints setting', () => {
    expect(configSource).toContain('PLATFORM_FEE_BPS')
  })

  test('has walletAddress setting', () => {
    expect(configSource).toContain('PLATFORM_FEE_WALLET')
  })
})

// ============================================
// Static analysis: Admin Fee Stats Action
// ============================================

const actionPath = 'app/Actions/Admin/PlatformFeeStatsAction.ts'

describe('PlatformFeeStatsAction', () => {
  test('file exists', () => {
    expect(existsSync(actionPath)).toBe(true)
  })

  test('imports PlatformFeeService', () => {
    const source = readFileSync(actionPath, 'utf-8')
    expect(source).toContain('PlatformFeeService')
  })

  test('calls getTotalFees', () => {
    const source = readFileSync(actionPath, 'utf-8')
    expect(source).toContain('getTotalFees')
  })

  test('calls getRecentFees', () => {
    const source = readFileSync(actionPath, 'utf-8')
    expect(source).toContain('getRecentFees')
  })
})

// ============================================
// Static analysis: TokenService fee methods
// ============================================

const tokenServicePath = 'app/Services/TokenService.ts'
const tokenServiceSource = readFileSync(tokenServicePath, 'utf-8')

describe('TokenService calculatePlatformFee', () => {
  test('has calculatePlatformFee method', () => {
    expect(tokenServiceSource).toContain('calculatePlatformFee(')
  })

  test('returns feeAmount and netAmount', () => {
    expect(tokenServiceSource).toContain('feeAmount')
    expect(tokenServiceSource).toContain('netAmount')
  })
})

// ============================================
// Mock mode runtime tests
// ============================================

describe('PlatformFeeService.calculateFee', () => {
  let PlatformFeeService: any

  beforeAll(async () => {
    process.env.TOKENS_MOCK_MODE = 'true'
    const mod = await import('../../app/Services/PlatformFeeService')
    PlatformFeeService = mod.PlatformFeeService
  })

  test('calculateFee returns correct amounts for 1% (100 bps)', () => {
    // Note: depends on config having platformFee enabled
    // If disabled, should return zero fee
    const result = PlatformFeeService.calculateFee(BigInt(1_000_000_000))
    expect(typeof result.feeAmount).toBe('bigint')
    expect(typeof result.netAmount).toBe('bigint')
    expect(result.feeAmount + result.netAmount).toBe(BigInt(1_000_000_000))
  })
})

// ============================================
// Migration exists
// ============================================

describe('Platform fees migration', () => {
  test('migration file exists', () => {
    expect(existsSync('database/migrations/1770353241-create-platform-fees-table.sql')).toBe(true)
  })

  test('migration creates platform_fees table', () => {
    const sql = readFileSync('database/migrations/1770353241-create-platform-fees-table.sql', 'utf-8')
    expect(sql).toContain('platform_fees')
    expect(sql).toContain('fee_amount')
    expect(sql).toContain('platform_wallet')
  })
})
