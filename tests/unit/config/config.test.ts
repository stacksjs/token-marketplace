/**
 * Configuration Tests
 *
 * Verifies config files exist and contain expected marketplace settings.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

describe('Token config', () => {
  const path = 'config/tokens.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('defines network configuration', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('network')
  })

  test('defines marketplace fee settings', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('fee')
  })

  test('supports mock mode', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('mock')
  })
})

describe('App config', () => {
  test('app config exists', () => {
    expect(existsSync('config/app.ts')).toBe(true)
  })
})

describe('Database config', () => {
  test('database config exists', () => {
    expect(existsSync('config/database.ts')).toBe(true)
  })
})

describe('Environment files', () => {
  test('.env.example exists', () => {
    expect(existsSync('.env.example')).toBe(true)
  })

  test('.env.example contains Solana settings', () => {
    const source = readFileSync('.env.example', 'utf-8')
    expect(source).toContain('SOLANA')
  })
})
