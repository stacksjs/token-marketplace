import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify Media action files
// ============================================

const proxyPath = 'app/Actions/Media/ImageProxyAction.ts'
const statusPath = 'app/Actions/Media/ImageCDNStatusAction.ts'
const proxySource = readFileSync(proxyPath, 'utf-8')
const statusSource = readFileSync(statusPath, 'utf-8')

describe('ImageProxyAction file structure', () => {
  test('file exists', () => {
    expect(existsSync(proxyPath)).toBe(true)
  })

  test('imports Action from stacksjs', () => {
    expect(proxySource).toContain("import { Action } from '@stacksjs/actions'")
  })

  test('imports imageCDNService', () => {
    expect(proxySource).toContain('imageCDNService')
  })

  test('imports ImageCDNError', () => {
    expect(proxySource).toContain('ImageCDNError')
  })

  test('exports Action with name', () => {
    expect(proxySource).toContain("name: 'Image Proxy'")
  })

  test('is a GET method', () => {
    expect(proxySource).toContain("method: 'GET'")
  })

  test('has handle method', () => {
    expect(proxySource).toContain('async handle(request')
  })
})

describe('ImageProxyAction parameter handling', () => {
  test('reads url parameter', () => {
    expect(proxySource).toContain("url.searchParams.get('url')")
  })

  test('reads width parameter', () => {
    expect(proxySource).toContain("url.searchParams.get('w')")
  })

  test('reads height parameter', () => {
    expect(proxySource).toContain("url.searchParams.get('h')")
  })

  test('reads quality parameter', () => {
    expect(proxySource).toContain("url.searchParams.get('q')")
  })

  test('reads format parameter', () => {
    expect(proxySource).toContain("url.searchParams.get('f')")
  })

  test('supports preset parameter', () => {
    expect(proxySource).toContain("url.searchParams.get('preset')")
    expect(proxySource).toContain('imageCDNService.getPreset(preset)')
  })

  test('returns 400 when url param is missing', () => {
    expect(proxySource).toContain("'Missing url parameter'")
    expect(proxySource).toContain('400')
  })

  test('clamps width to max 2000', () => {
    expect(proxySource).toContain('Math.min(2000')
  })

  test('validates format values', () => {
    expect(proxySource).toContain("'webp', 'jpeg', 'png', 'avif'")
  })
})

describe('ImageProxyAction error handling', () => {
  test('handles ImageCDNError with appropriate status codes', () => {
    expect(proxySource).toContain('FORBIDDEN_HOST: 403')
    expect(proxySource).toContain('FETCH_FAILED: 502')
    expect(proxySource).toContain('SOURCE_ERROR: 502')
    expect(proxySource).toContain('INVALID_CONTENT_TYPE: 415')
    expect(proxySource).toContain('TOO_LARGE: 413')
  })

  test('returns 500 for unknown errors', () => {
    expect(proxySource).toContain("'Internal server error'")
    expect(proxySource).toContain('500')
  })
})

describe('ImageProxyAction response', () => {
  test('returns image as Response with headers', () => {
    expect(proxySource).toContain('imageCDNService.getResponseHeaders(cached)')
    expect(proxySource).toContain('new Response(cached.buffer')
  })
})

describe('ImageCDNStatusAction file structure', () => {
  test('file exists', () => {
    expect(existsSync(statusPath)).toBe(true)
  })

  test('imports Action from stacksjs', () => {
    expect(statusSource).toContain("import { Action } from '@stacksjs/actions'")
  })

  test('imports imageCDNService', () => {
    expect(statusSource).toContain('imageCDNService')
  })

  test('exports Action with name', () => {
    expect(statusSource).toContain("name: 'Image CDN Status'")
  })

  test('is a GET method', () => {
    expect(statusSource).toContain("method: 'GET'")
  })
})

describe('ImageCDNStatusAction response data', () => {
  test('returns status', () => {
    expect(statusSource).toContain("status: 'running'")
  })

  test('returns sharpAvailable', () => {
    expect(statusSource).toContain('sharpAvailable')
    expect(statusSource).toContain('imageCDNService.isSharpAvailable()')
  })

  test('returns cache stats', () => {
    expect(statusSource).toContain('memoryEntries')
    expect(statusSource).toContain('memorySizeMB')
    expect(statusSource).toContain('diskEnabled')
  })

  test('returns traffic stats', () => {
    expect(statusSource).toContain('totalServed')
    expect(statusSource).toContain('totalFetched')
    expect(statusSource).toContain('totalErrors')
    expect(statusSource).toContain('cacheHitRate')
  })

  test('returns allowed hosts', () => {
    expect(statusSource).toContain('allowedHosts')
  })

  test('returns presets', () => {
    expect(statusSource).toContain('imageCDNService.getPresets()')
  })
})

// ============================================
// Verify routes are registered
// ============================================

const routesPath = 'routes/api.ts'
const routesSource = readFileSync(routesPath, 'utf-8')

describe('Media routes', () => {
  test('image proxy route exists', () => {
    expect(routesSource).toContain("route.get('/media/image', 'Actions/Media/ImageProxyAction')")
  })

  test('CDN status route exists', () => {
    expect(routesSource).toContain("route.get('/media/status', 'Actions/Media/ImageCDNStatusAction')")
  })
})
