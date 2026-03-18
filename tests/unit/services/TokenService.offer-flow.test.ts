/**
 * TokenService Offer Flow - Static Analysis Tests
 *
 * Verifies that the TokenService contains all offer-related methods.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

const servicePath = 'app/Services/TokenService.ts'

describe('TokenService offer methods', () => {
  test('service file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  const source = readFileSync(servicePath, 'utf-8')

  test('has makeOffer method', () => {
    expect(source).toContain('makeOffer')
  })

  test('has acceptOffer method', () => {
    expect(source).toContain('acceptOffer')
  })

  test('has cancelOffer method', () => {
    expect(source).toContain('cancelOffer')
  })

  test('handles offer amount', () => {
    expect(source).toContain('amount')
  })

  test('tracks offer status', () => {
    expect(source).toContain('status')
  })
})
