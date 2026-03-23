import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify ImageCDNService structure
// ============================================

const servicePath = 'app/Services/ImageCDNService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('ImageCDNService file structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('defines ImageCDNService class', () => {
    expect(serviceSource).toContain('class ImageCDNService')
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const imageCDNService = new ImageCDNService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default ImageCDNService')
  })

  test('exports ImageCDNError class', () => {
    expect(serviceSource).toContain('export class ImageCDNError')
  })
})

describe('ImageCDNService types', () => {
  test('defines ImageOptions interface', () => {
    expect(serviceSource).toContain('export interface ImageOptions')
  })

  test('ImageOptions has width and height', () => {
    expect(serviceSource).toContain('width?: number')
    expect(serviceSource).toContain('height?: number')
  })

  test('ImageOptions has quality and format', () => {
    expect(serviceSource).toContain('quality?: number')
    expect(serviceSource).toContain("format?: 'webp' | 'jpeg' | 'png' | 'avif'")
  })

  test('defines CachedImage interface', () => {
    expect(serviceSource).toContain('export interface CachedImage')
  })

  test('CachedImage has buffer and contentType', () => {
    expect(serviceSource).toContain('buffer: Buffer')
    expect(serviceSource).toContain('contentType: string')
  })

  test('defines ImageCDNStats interface', () => {
    expect(serviceSource).toContain('export interface ImageCDNStats')
  })
})

describe('ImageCDNService SSRF protection', () => {
  test('has isAllowedUrl method', () => {
    expect(serviceSource).toContain('isAllowedUrl(url: string): boolean')
  })

  test('includes default allowed hosts', () => {
    expect(serviceSource).toContain("'arweave.net'")
    expect(serviceSource).toContain("'ipfs.io'")
    expect(serviceSource).toContain("'gateway.pinata.cloud'")
    expect(serviceSource).toContain("'nftstorage.link'")
    expect(serviceSource).toContain("'shdw-drive.genesysgo.net'")
  })

  test('validates protocol (http/https only)', () => {
    expect(serviceSource).toContain("parsed.protocol !== 'http:'")
    expect(serviceSource).toContain("parsed.protocol !== 'https:'")
  })

  test('has addAllowedHosts method', () => {
    expect(serviceSource).toContain('addAllowedHosts(hosts: string[]): void')
  })

  test('has removeAllowedHosts method', () => {
    expect(serviceSource).toContain('removeAllowedHosts(hosts: string[]): void')
  })
})

describe('ImageCDNService caching', () => {
  test('has memory cache with Map', () => {
    expect(serviceSource).toContain('private memoryCache: Map<string, CachedImage>')
  })

  test('has memory cache size limit', () => {
    expect(serviceSource).toContain('MAX_MEMORY_CACHE_SIZE')
  })

  test('has memory cache TTL', () => {
    expect(serviceSource).toContain('MEMORY_CACHE_TTL')
  })

  test('has disk cache support', () => {
    expect(serviceSource).toContain('readDiskCache')
    expect(serviceSource).toContain('writeDiskCache')
  })

  test('has clearMemoryCache method', () => {
    expect(serviceSource).toContain('clearMemoryCache(): void')
  })

  test('generates cache keys with SHA256', () => {
    expect(serviceSource).toContain("createHash('sha256')")
  })

  test('evicts old entries when cache is full', () => {
    expect(serviceSource).toContain('this.memoryCacheSize + cached.buffer.length > MAX_MEMORY_CACHE_SIZE')
  })
})

describe('ImageCDNService image processing', () => {
  test('has getImage method', () => {
    expect(serviceSource).toContain('async getImage(url: string, options: ImageOptions')
  })

  test('has processImage method', () => {
    expect(serviceSource).toContain('private async processImage')
  })

  test('supports sharp for resizing', () => {
    expect(serviceSource).toContain("await import('sharp')")
  })

  test('gracefully falls back when sharp is not available', () => {
    expect(serviceSource).toContain('this.sharpModule = null')
    expect(serviceSource).toContain('return source')
  })

  test('validates content type', () => {
    expect(serviceSource).toContain('ALLOWED_CONTENT_TYPES')
    expect(serviceSource).toContain("'image/jpeg'")
    expect(serviceSource).toContain("'image/png'")
    expect(serviceSource).toContain("'image/webp'")
  })

  test('enforces max image size', () => {
    expect(serviceSource).toContain('MAX_IMAGE_SIZE')
    expect(serviceSource).toContain('10 * 1024 * 1024')
  })

  test('uses AbortSignal timeout for fetch', () => {
    expect(serviceSource).toContain('AbortSignal.timeout(15_000)')
  })
})

describe('ImageCDNService size presets', () => {
  test('has thumbnail preset', () => {
    expect(serviceSource).toContain('thumbnail:')
    expect(serviceSource).toContain('width: 150')
  })

  test('has card preset', () => {
    expect(serviceSource).toContain('card:')
    expect(serviceSource).toContain('width: 400')
  })

  test('has detail preset', () => {
    expect(serviceSource).toContain('detail:')
    expect(serviceSource).toContain('width: 800')
  })

  test('has full preset', () => {
    expect(serviceSource).toContain('full:')
    expect(serviceSource).toContain('width: 1200')
  })

  test('has getPreset method', () => {
    expect(serviceSource).toContain('getPreset(name: string)')
  })

  test('has getPresets method', () => {
    expect(serviceSource).toContain('getPresets()')
  })
})

describe('ImageCDNService statistics', () => {
  test('has getStats method', () => {
    expect(serviceSource).toContain('getStats(): ImageCDNStats')
  })

  test('tracks totalServed', () => {
    expect(serviceSource).toContain('this.totalServed')
  })

  test('tracks totalFetched', () => {
    expect(serviceSource).toContain('this.totalFetched')
  })

  test('tracks totalErrors', () => {
    expect(serviceSource).toContain('this.totalErrors')
  })

  test('has resetStats method', () => {
    expect(serviceSource).toContain('resetStats(): void')
  })
})

describe('ImageCDNService response headers', () => {
  test('has getResponseHeaders method', () => {
    expect(serviceSource).toContain('getResponseHeaders(cached: CachedImage)')
  })

  test('sets Cache-Control header', () => {
    expect(serviceSource).toContain("'Cache-Control': 'public, max-age=86400'")
  })

  test('sets CDN-Cache-Control header', () => {
    expect(serviceSource).toContain("'CDN-Cache-Control': 'public, max-age=604800'")
  })

  test('sets X-Image-Cache header', () => {
    expect(serviceSource).toContain("'X-Image-Cache': 'HIT'")
  })
})

describe('ImageCDNError', () => {
  test('extends Error', () => {
    expect(serviceSource).toContain('class ImageCDNError extends Error')
  })

  test('has code property', () => {
    expect(serviceSource).toContain('code: string')
  })

  test('uses error codes', () => {
    expect(serviceSource).toContain("'FORBIDDEN_HOST'")
    expect(serviceSource).toContain("'FETCH_FAILED'")
    expect(serviceSource).toContain("'SOURCE_ERROR'")
    expect(serviceSource).toContain("'INVALID_CONTENT_TYPE'")
    expect(serviceSource).toContain("'TOO_LARGE'")
  })
})

// ============================================
// Runtime tests: ImageCDNService instance
// ============================================

describe('ImageCDNService runtime - URL validation', () => {
  // Import the actual service for runtime tests
  const { imageCDNService, ImageCDNError } = require('../../../app/Services/ImageCDNService')

  test('allows arweave.net URLs', () => {
    expect(imageCDNService.isAllowedUrl('https://arweave.net/abc123')).toBe(true)
  })

  test('allows www.arweave.net URLs', () => {
    expect(imageCDNService.isAllowedUrl('https://www.arweave.net/abc123')).toBe(true)
  })

  test('allows ipfs.io URLs', () => {
    expect(imageCDNService.isAllowedUrl('https://ipfs.io/ipfs/Qm123')).toBe(true)
  })

  test('allows gateway.pinata.cloud URLs', () => {
    expect(imageCDNService.isAllowedUrl('https://gateway.pinata.cloud/ipfs/Qm123')).toBe(true)
  })

  test('allows nftstorage.link URLs', () => {
    expect(imageCDNService.isAllowedUrl('https://nftstorage.link/ipfs/Qm123')).toBe(true)
  })

  test('allows shdw-drive.genesysgo.net URLs', () => {
    expect(imageCDNService.isAllowedUrl('https://shdw-drive.genesysgo.net/abc/img.png')).toBe(true)
  })

  test('blocks unknown hosts', () => {
    expect(imageCDNService.isAllowedUrl('https://evil.com/hack.jpg')).toBe(false)
  })

  test('blocks localhost', () => {
    expect(imageCDNService.isAllowedUrl('http://localhost:3000/secret')).toBe(false)
  })

  test('blocks file:// protocol', () => {
    expect(imageCDNService.isAllowedUrl('file:///etc/passwd')).toBe(false)
  })

  test('blocks ftp:// protocol', () => {
    expect(imageCDNService.isAllowedUrl('ftp://arweave.net/abc')).toBe(false)
  })

  test('blocks internal IPs', () => {
    expect(imageCDNService.isAllowedUrl('http://192.168.1.1/image.png')).toBe(false)
    expect(imageCDNService.isAllowedUrl('http://10.0.0.1/image.png')).toBe(false)
    expect(imageCDNService.isAllowedUrl('http://127.0.0.1/image.png')).toBe(false)
  })

  test('handles invalid URLs gracefully', () => {
    expect(imageCDNService.isAllowedUrl('not-a-url')).toBe(false)
    expect(imageCDNService.isAllowedUrl('')).toBe(false)
  })
})

describe('ImageCDNService runtime - allowed hosts management', () => {
  const { imageCDNService } = require('../../../app/Services/ImageCDNService')

  test('can add custom hosts', () => {
    imageCDNService.addAllowedHosts(['custom-cdn.example.com'])
    expect(imageCDNService.isAllowedUrl('https://custom-cdn.example.com/img.png')).toBe(true)
    // Clean up
    imageCDNService.removeAllowedHosts(['custom-cdn.example.com'])
  })

  test('can remove hosts', () => {
    imageCDNService.addAllowedHosts(['temp-host.com'])
    expect(imageCDNService.isAllowedUrl('https://temp-host.com/img.png')).toBe(true)
    imageCDNService.removeAllowedHosts(['temp-host.com'])
    expect(imageCDNService.isAllowedUrl('https://temp-host.com/img.png')).toBe(false)
  })

  test('getAllowedHosts returns array', () => {
    const hosts = imageCDNService.getAllowedHosts()
    expect(Array.isArray(hosts)).toBe(true)
    expect(hosts.length).toBeGreaterThan(0)
    expect(hosts).toContain('arweave.net')
  })
})

describe('ImageCDNService runtime - cache keys', () => {
  const { imageCDNService } = require('../../../app/Services/ImageCDNService')

  test('generates consistent cache keys for same inputs', () => {
    const key1 = imageCDNService.getCacheKey('https://arweave.net/abc', { width: 400 })
    const key2 = imageCDNService.getCacheKey('https://arweave.net/abc', { width: 400 })
    expect(key1).toBe(key2)
  })

  test('generates different keys for different URLs', () => {
    const key1 = imageCDNService.getCacheKey('https://arweave.net/abc', { width: 400 })
    const key2 = imageCDNService.getCacheKey('https://arweave.net/xyz', { width: 400 })
    expect(key1).not.toBe(key2)
  })

  test('generates different keys for different widths', () => {
    const key1 = imageCDNService.getCacheKey('https://arweave.net/abc', { width: 400 })
    const key2 = imageCDNService.getCacheKey('https://arweave.net/abc', { width: 800 })
    expect(key1).not.toBe(key2)
  })

  test('generates different keys for different formats', () => {
    const key1 = imageCDNService.getCacheKey('https://arweave.net/abc', { format: 'webp' })
    const key2 = imageCDNService.getCacheKey('https://arweave.net/abc', { format: 'jpeg' })
    expect(key1).not.toBe(key2)
  })

  test('cache key is a hex string', () => {
    const key = imageCDNService.getCacheKey('https://arweave.net/abc')
    expect(key).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('ImageCDNService runtime - presets', () => {
  const { imageCDNService } = require('../../../app/Services/ImageCDNService')

  test('getPreset returns thumbnail preset', () => {
    const preset = imageCDNService.getPreset('thumbnail')
    expect(preset).toBeDefined()
    expect(preset.width).toBe(150)
    expect(preset.format).toBe('webp')
  })

  test('getPreset returns card preset', () => {
    const preset = imageCDNService.getPreset('card')
    expect(preset).toBeDefined()
    expect(preset.width).toBe(400)
  })

  test('getPreset returns detail preset', () => {
    const preset = imageCDNService.getPreset('detail')
    expect(preset).toBeDefined()
    expect(preset.width).toBe(800)
  })

  test('getPreset returns full preset', () => {
    const preset = imageCDNService.getPreset('full')
    expect(preset).toBeDefined()
    expect(preset.width).toBe(1200)
  })

  test('getPreset returns undefined for unknown preset', () => {
    expect(imageCDNService.getPreset('nonexistent')).toBeUndefined()
  })

  test('getPresets returns all presets', () => {
    const presets = imageCDNService.getPresets()
    expect(Object.keys(presets)).toContain('thumbnail')
    expect(Object.keys(presets)).toContain('card')
    expect(Object.keys(presets)).toContain('detail')
    expect(Object.keys(presets)).toContain('full')
  })
})

describe('ImageCDNService runtime - stats', () => {
  const { imageCDNService } = require('../../../app/Services/ImageCDNService')

  test('getStats returns expected shape', () => {
    const stats = imageCDNService.getStats()
    expect(stats).toHaveProperty('memoryCacheSize')
    expect(stats).toHaveProperty('memoryCacheEntries')
    expect(stats).toHaveProperty('diskCacheEnabled')
    expect(stats).toHaveProperty('diskCachePath')
    expect(stats).toHaveProperty('allowedHosts')
    expect(stats).toHaveProperty('totalServed')
    expect(stats).toHaveProperty('totalFetched')
    expect(stats).toHaveProperty('totalErrors')
  })

  test('resetStats clears counters', () => {
    imageCDNService.resetStats()
    const stats = imageCDNService.getStats()
    expect(stats.totalServed).toBe(0)
    expect(stats.totalFetched).toBe(0)
    expect(stats.totalErrors).toBe(0)
  })
})

describe('ImageCDNService runtime - memory cache', () => {
  const { imageCDNService } = require('../../../app/Services/ImageCDNService')

  test('clearMemoryCache resets cache', () => {
    imageCDNService.clearMemoryCache()
    const stats = imageCDNService.getStats()
    expect(stats.memoryCacheEntries).toBe(0)
    expect(stats.memoryCacheSize).toBe(0)
  })
})

describe('ImageCDNService runtime - getImage rejects forbidden hosts', () => {
  const { imageCDNService, ImageCDNError } = require('../../../app/Services/ImageCDNService')

  test('rejects disallowed URLs', async () => {
    try {
      await imageCDNService.getImage('https://evil.com/image.png')
      expect(true).toBe(false) // should not reach here
    }
    catch (err: any) {
      expect(err).toBeInstanceOf(ImageCDNError)
      expect(err.code).toBe('FORBIDDEN_HOST')
    }
  })
})

describe('ImageCDNService runtime - response headers', () => {
  const { imageCDNService } = require('../../../app/Services/ImageCDNService')

  test('getResponseHeaders returns correct headers', () => {
    const cached = {
      buffer: Buffer.from('test'),
      contentType: 'image/webp',
      cachedAt: Date.now(),
      originalUrl: 'https://arweave.net/abc',
    }
    const headers = imageCDNService.getResponseHeaders(cached)
    expect(headers['Content-Type']).toBe('image/webp')
    expect(headers['Cache-Control']).toBe('public, max-age=86400')
    expect(headers['CDN-Cache-Control']).toBe('public, max-age=604800')
    expect(headers['X-Image-Cache']).toBe('HIT')
    expect(headers['X-Original-Url']).toBe('https://arweave.net/abc')
  })
})
