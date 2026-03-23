/**
 * Image CDN Service
 *
 * Proxies, caches, and optionally resizes NFT images from external sources
 * (Arweave, IPFS, Shadow Drive). Prevents SSRF by allowlisting hosts.
 *
 * Features:
 *   - Host allowlist to prevent SSRF attacks
 *   - In-memory and disk cache with TTL
 *   - On-the-fly resizing when sharp is available
 *   - Content-type detection and validation
 *   - Configurable size presets
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

// ============================================
// Types
// ============================================

export interface ImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export interface CachedImage {
  buffer: Buffer
  contentType: string
  cachedAt: number
  originalUrl: string
  width?: number
  height?: number
}

export interface ImageCDNStats {
  memoryCacheSize: number
  memoryCacheEntries: number
  diskCacheEnabled: boolean
  diskCachePath: string
  allowedHosts: string[]
  sharpAvailable: boolean
  totalServed: number
  totalFetched: number
  totalErrors: number
}

// ============================================
// Constants
// ============================================

const DEFAULT_ALLOWED_HOSTS = [
  'arweave.net',
  'www.arweave.net',
  'ipfs.io',
  'gateway.pinata.cloud',
  'nftstorage.link',
  'shdw-drive.genesysgo.net',
  'cf-ipfs.com',
  'dweb.link',
  'gateway.ipfs.io',
]

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
]

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
const MEMORY_CACHE_TTL = 3600_000 // 1 hour
const MAX_MEMORY_CACHE_SIZE = 100 * 1024 * 1024 // 100 MB total

const SIZE_PRESETS: Record<string, ImageOptions> = {
  thumbnail: { width: 150, height: 150, quality: 70, format: 'webp', fit: 'cover' },
  card: { width: 400, height: 400, quality: 80, format: 'webp', fit: 'cover' },
  detail: { width: 800, quality: 85, format: 'webp', fit: 'inside' },
  full: { width: 1200, quality: 90, format: 'webp', fit: 'inside' },
}

// ============================================
// ImageCDNService
// ============================================

class ImageCDNService {
  private memoryCache: Map<string, CachedImage> = new Map()
  private memoryCacheSize = 0
  private diskCachePath: string
  private allowedHosts: Set<string>
  private sharpModule: any = null
  private sharpChecked = false
  private totalServed = 0
  private totalFetched = 0
  private totalErrors = 0

  constructor() {
    this.diskCachePath = join(process.cwd(), 'storage', 'cache', 'images')
    this.allowedHosts = new Set(DEFAULT_ALLOWED_HOSTS)
  }

  /**
   * Add hosts to the allowlist.
   */
  addAllowedHosts(hosts: string[]): void {
    for (const host of hosts) {
      this.allowedHosts.add(host)
    }
  }

  /**
   * Remove hosts from the allowlist.
   */
  removeAllowedHosts(hosts: string[]): void {
    for (const host of hosts) {
      this.allowedHosts.delete(host)
    }
  }

  /**
   * Get the current list of allowed hosts.
   */
  getAllowedHosts(): string[] {
    return Array.from(this.allowedHosts)
  }

  /**
   * Validate that a URL is from an allowed host.
   * Prevents SSRF attacks by checking against the allowlist.
   */
  isAllowedUrl(url: string): boolean {
    try {
      const parsed = new URL(url)

      // Only allow http/https
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false
      }

      // Check against allowlist
      return Array.from(this.allowedHosts).some(
        host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
      )
    }
    catch {
      return false
    }
  }

  /**
   * Generate a cache key for an image request.
   */
  getCacheKey(url: string, options: ImageOptions = {}): string {
    const normalized = `${url}:${options.width || 0}:${options.height || 0}:${options.quality || 80}:${options.format || 'original'}:${options.fit || 'cover'}`
    return createHash('sha256').update(normalized).digest('hex')
  }

  /**
   * Get a size preset by name.
   */
  getPreset(name: string): ImageOptions | undefined {
    return SIZE_PRESETS[name]
  }

  /**
   * Get all available presets.
   */
  getPresets(): Record<string, ImageOptions> {
    return { ...SIZE_PRESETS }
  }

  /**
   * Fetch, optionally resize, and cache an image.
   * Returns the processed image buffer and content type.
   */
  async getImage(url: string, options: ImageOptions = {}): Promise<CachedImage> {
    // Validate URL
    if (!this.isAllowedUrl(url)) {
      throw new ImageCDNError('Image host not allowed', 'FORBIDDEN_HOST')
    }

    const cacheKey = this.getCacheKey(url, options)

    // Check memory cache
    const memoryCached = this.memoryCache.get(cacheKey)
    if (memoryCached && Date.now() - memoryCached.cachedAt < MEMORY_CACHE_TTL) {
      this.totalServed++
      return memoryCached
    }

    // Check disk cache
    const diskCached = this.readDiskCache(cacheKey)
    if (diskCached) {
      this.setMemoryCache(cacheKey, diskCached)
      this.totalServed++
      return diskCached
    }

    // Fetch from origin
    const fetched = await this.fetchImage(url)
    this.totalFetched++

    // Resize if sharp is available and options request it
    let processed = fetched
    if (options.width || options.height || options.format) {
      processed = await this.processImage(fetched, options)
    }

    const cached: CachedImage = {
      buffer: processed.buffer,
      contentType: processed.contentType,
      cachedAt: Date.now(),
      originalUrl: url,
      width: options.width,
      height: options.height,
    }

    // Store in caches
    this.setMemoryCache(cacheKey, cached)
    this.writeDiskCache(cacheKey, cached)
    this.totalServed++

    return cached
  }

  /**
   * Fetch an image from a remote URL.
   */
  private async fetchImage(url: string): Promise<{ buffer: Buffer, contentType: string }> {
    let imageResponse: Response
    try {
      imageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'TokenMarketplace-ImageCDN/1.0',
          'Accept': 'image/*',
        },
        signal: AbortSignal.timeout(15_000),
      })
    }
    catch (err) {
      this.totalErrors++
      throw new ImageCDNError(
        `Failed to fetch image: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'FETCH_FAILED',
      )
    }

    if (!imageResponse.ok) {
      this.totalErrors++
      throw new ImageCDNError(
        `Image source returned ${imageResponse.status}`,
        'SOURCE_ERROR',
      )
    }

    // Validate content type
    const contentType = imageResponse.headers.get('content-type') || ''
    const baseContentType = contentType.split(';')[0].trim().toLowerCase()
    if (!ALLOWED_CONTENT_TYPES.includes(baseContentType)) {
      this.totalErrors++
      throw new ImageCDNError(
        `Invalid content type: ${baseContentType}`,
        'INVALID_CONTENT_TYPE',
      )
    }

    // Check size via Content-Length header
    const contentLength = imageResponse.headers.get('content-length')
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      this.totalErrors++
      throw new ImageCDNError('Image exceeds maximum size', 'TOO_LARGE')
    }

    const arrayBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Verify actual size
    if (buffer.length > MAX_IMAGE_SIZE) {
      this.totalErrors++
      throw new ImageCDNError('Image exceeds maximum size', 'TOO_LARGE')
    }

    return { buffer, contentType: baseContentType }
  }

  /**
   * Process (resize/convert) an image using sharp if available.
   * Falls back to returning the original if sharp is not installed.
   */
  private async processImage(
    source: { buffer: Buffer, contentType: string },
    options: ImageOptions,
  ): Promise<{ buffer: Buffer, contentType: string }> {
    const sharp = await this.getSharp()
    if (!sharp) {
      // No sharp available — return original
      return source
    }

    try {
      let pipeline = sharp(source.buffer)

      // Resize
      if (options.width || options.height) {
        pipeline = pipeline.resize(options.width, options.height, {
          fit: options.fit || 'cover',
          withoutEnlargement: true,
        })
      }

      // Format conversion
      const format = options.format || 'webp'
      const quality = options.quality || 80

      switch (format) {
        case 'webp':
          pipeline = pipeline.webp({ quality })
          break
        case 'avif':
          pipeline = pipeline.avif({ quality })
          break
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality })
          break
        case 'png':
          pipeline = pipeline.png({ quality })
          break
      }

      const resultBuffer = await pipeline.toBuffer()
      return {
        buffer: resultBuffer,
        contentType: `image/${format}`,
      }
    }
    catch {
      // If processing fails, return original
      return source
    }
  }

  /**
   * Try to load the sharp module.
   */
  private async getSharp(): Promise<any> {
    if (this.sharpChecked) return this.sharpModule

    this.sharpChecked = true
    try {
      this.sharpModule = (await import('sharp')).default
    }
    catch {
      this.sharpModule = null
    }
    return this.sharpModule
  }

  /**
   * Check if sharp is available (for testing/status).
   */
  async isSharpAvailable(): Promise<boolean> {
    const sharp = await this.getSharp()
    return sharp !== null
  }

  /**
   * Store an image in the memory cache, evicting old entries if needed.
   */
  private setMemoryCache(key: string, cached: CachedImage): void {
    // Evict if we'd exceed the limit
    while (this.memoryCacheSize + cached.buffer.length > MAX_MEMORY_CACHE_SIZE && this.memoryCache.size > 0) {
      const oldestKey = this.memoryCache.keys().next().value
      if (oldestKey) {
        const evicted = this.memoryCache.get(oldestKey)
        if (evicted) {
          this.memoryCacheSize -= evicted.buffer.length
        }
        this.memoryCache.delete(oldestKey)
      }
    }

    // Remove existing entry size if replacing
    const existing = this.memoryCache.get(key)
    if (existing) {
      this.memoryCacheSize -= existing.buffer.length
    }

    this.memoryCache.set(key, cached)
    this.memoryCacheSize += cached.buffer.length
  }

  /**
   * Read an image from disk cache.
   */
  private readDiskCache(key: string): CachedImage | null {
    try {
      const metaPath = join(this.diskCachePath, `${key}.json`)
      const dataPath = join(this.diskCachePath, `${key}.bin`)

      if (!existsSync(metaPath) || !existsSync(dataPath)) return null

      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
      const buffer = readFileSync(dataPath)

      return {
        buffer,
        contentType: meta.contentType,
        cachedAt: meta.cachedAt,
        originalUrl: meta.originalUrl,
        width: meta.width,
        height: meta.height,
      }
    }
    catch {
      return null
    }
  }

  /**
   * Write an image to disk cache.
   */
  private writeDiskCache(key: string, cached: CachedImage): void {
    try {
      if (!existsSync(this.diskCachePath)) {
        mkdirSync(this.diskCachePath, { recursive: true })
      }

      const metaPath = join(this.diskCachePath, `${key}.json`)
      const dataPath = join(this.diskCachePath, `${key}.bin`)

      const meta = {
        contentType: cached.contentType,
        cachedAt: cached.cachedAt,
        originalUrl: cached.originalUrl,
        width: cached.width,
        height: cached.height,
      }

      writeFileSync(metaPath, JSON.stringify(meta))
      writeFileSync(dataPath, cached.buffer)
    }
    catch {
      // Disk write failure is non-fatal
    }
  }

  /**
   * Clear the memory cache.
   */
  clearMemoryCache(): void {
    this.memoryCache.clear()
    this.memoryCacheSize = 0
  }

  /**
   * Clear all caches (memory and disk).
   */
  clearAllCaches(): void {
    this.clearMemoryCache()
    // Disk cache cleared by removing files — not implemented here
    // to avoid accidental deletion. Use a separate cleanup job.
  }

  /**
   * Get service statistics.
   */
  getStats(): ImageCDNStats {
    return {
      memoryCacheSize: this.memoryCacheSize,
      memoryCacheEntries: this.memoryCache.size,
      diskCacheEnabled: true,
      diskCachePath: this.diskCachePath,
      allowedHosts: this.getAllowedHosts(),
      sharpAvailable: this.sharpModule !== null,
      totalServed: this.totalServed,
      totalFetched: this.totalFetched,
      totalErrors: this.totalErrors,
    }
  }

  /**
   * Reset stats counters (for testing).
   */
  resetStats(): void {
    this.totalServed = 0
    this.totalFetched = 0
    this.totalErrors = 0
  }

  /**
   * Build response headers for serving a cached image.
   */
  getResponseHeaders(cached: CachedImage): Record<string, string> {
    return {
      'Content-Type': cached.contentType,
      'Cache-Control': 'public, max-age=86400',
      'CDN-Cache-Control': 'public, max-age=604800',
      'X-Image-Cache': 'HIT',
      'X-Original-Url': cached.originalUrl,
    }
  }
}

// ============================================
// Error class
// ============================================

export class ImageCDNError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'ImageCDNError'
    this.code = code
  }
}

// Singleton
export const imageCDNService = new ImageCDNService()
export default ImageCDNService
