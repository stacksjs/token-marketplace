import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify helpers additions
// ============================================

const helpersPath = 'app/Actions/helpers.ts'
const helpersSource = readFileSync(helpersPath, 'utf-8')

describe('cdnImage helper structure', () => {
  test('helpers file exists', () => {
    expect(existsSync(helpersPath)).toBe(true)
  })

  test('exports cdnImage function', () => {
    expect(helpersSource).toContain('export function cdnImage(')
  })

  test('cdnImage has url, width, and format parameters', () => {
    expect(helpersSource).toContain("url: string, width: number = 400, format: string = 'webp'")
  })

  test('cdnImage returns string', () => {
    expect(helpersSource).toContain('cdnImage(url: string, width: number = 400, format: string = \'webp\'): string')
  })

  test('returns placeholder for empty URLs', () => {
    expect(helpersSource).toContain("'/assets/images/placeholder-nft.png'")
  })

  test('passes through local URLs', () => {
    expect(helpersSource).toContain("url.startsWith('/')")
  })

  test('generates proxied URL with encoded params', () => {
    expect(helpersSource).toContain('encodeURIComponent(url)')
    expect(helpersSource).toContain('/api/media/image?url=')
  })

  test('exports imageSizes presets', () => {
    expect(helpersSource).toContain('export const imageSizes')
  })

  test('imageSizes has thumbnail preset', () => {
    expect(helpersSource).toContain('thumbnail: (url: string) => cdnImage(url, 150)')
  })

  test('imageSizes has card preset', () => {
    expect(helpersSource).toContain('card: (url: string) => cdnImage(url, 400)')
  })

  test('imageSizes has detail preset', () => {
    expect(helpersSource).toContain('detail: (url: string) => cdnImage(url, 800)')
  })

  test('imageSizes has full preset', () => {
    expect(helpersSource).toContain('full: (url: string) => cdnImage(url, 1200)')
  })
})

// ============================================
// Runtime tests: cdnImage helper
// ============================================

describe('cdnImage runtime', () => {
  const { cdnImage, imageSizes } = require('../../../app/Actions/helpers')

  test('returns placeholder for empty string', () => {
    expect(cdnImage('')).toBe('/assets/images/placeholder-nft.png')
  })

  test('returns placeholder for undefined/null', () => {
    expect(cdnImage(undefined as any)).toBe('/assets/images/placeholder-nft.png')
    expect(cdnImage(null as any)).toBe('/assets/images/placeholder-nft.png')
  })

  test('passes through local URLs starting with /', () => {
    expect(cdnImage('/assets/images/logo.png')).toBe('/assets/images/logo.png')
  })

  test('generates proxy URL for arweave', () => {
    const result = cdnImage('https://arweave.net/abc123')
    expect(result).toContain('/api/media/image?url=')
    expect(result).toContain(encodeURIComponent('https://arweave.net/abc123'))
    expect(result).toContain('w=400')
    expect(result).toContain('f=webp')
  })

  test('respects custom width', () => {
    const result = cdnImage('https://arweave.net/abc123', 800)
    expect(result).toContain('w=800')
  })

  test('respects custom format', () => {
    const result = cdnImage('https://arweave.net/abc123', 400, 'jpeg')
    expect(result).toContain('f=jpeg')
  })

  test('encodes special characters in URL', () => {
    const result = cdnImage('https://arweave.net/abc?q=1&x=2')
    expect(result).toContain(encodeURIComponent('https://arweave.net/abc?q=1&x=2'))
  })
})

describe('imageSizes runtime', () => {
  const { imageSizes } = require('../../../app/Actions/helpers')

  test('thumbnail generates 150px URL', () => {
    const result = imageSizes.thumbnail('https://arweave.net/abc')
    expect(result).toContain('w=150')
  })

  test('card generates 400px URL', () => {
    const result = imageSizes.card('https://arweave.net/abc')
    expect(result).toContain('w=400')
  })

  test('detail generates 800px URL', () => {
    const result = imageSizes.detail('https://arweave.net/abc')
    expect(result).toContain('w=800')
  })

  test('full generates 1200px URL', () => {
    const result = imageSizes.full('https://arweave.net/abc')
    expect(result).toContain('w=1200')
  })
})
