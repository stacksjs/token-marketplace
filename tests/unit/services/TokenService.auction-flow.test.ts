/**
 * TokenService Auction Flow - Static Analysis Tests
 *
 * Verifies that the TokenService contains all auction-related methods.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

const servicePath = 'app/Services/TokenService.ts'

describe('TokenService auction methods', () => {
  test('service file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  const source = readFileSync(servicePath, 'utf-8')

  test('has createAuction method', () => {
    expect(source).toContain('createAuction')
  })

  test('has placeBid method', () => {
    expect(source).toContain('placeBid')
  })

  test('has settleAuction method', () => {
    expect(source).toContain('settleAuction')
  })

  test('has cancelAuction method', () => {
    expect(source).toContain('cancelAuction')
  })

  test('supports english auction type', () => {
    expect(source).toContain('english')
  })

  test('supports dutch auction type', () => {
    expect(source).toContain('dutch')
  })

  test('handles auction duration', () => {
    expect(source).toContain('duration')
  })

  test('handles start price', () => {
    expect(source).toContain('startPrice')
  })
})
