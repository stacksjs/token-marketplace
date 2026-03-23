import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify LaunchpadService structure
// ============================================

const servicePath = 'app/Services/LaunchpadService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('LaunchpadService file structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('defines LaunchpadService class', () => {
    expect(serviceSource).toContain('class LaunchpadService')
  })

  test('exports singleton instance', () => {
    expect(serviceSource).toContain('export const launchpadService = new LaunchpadService()')
  })

  test('exports default class', () => {
    expect(serviceSource).toContain('export default LaunchpadService')
  })
})

describe('LaunchpadService types', () => {
  test('defines LaunchpadConfig interface', () => {
    expect(serviceSource).toContain('export interface LaunchpadConfig')
  })

  test('defines MintPhase interface', () => {
    expect(serviceSource).toContain('export interface MintPhase')
  })

  test('MintPhase has name, price, startDate, maxPerWallet', () => {
    expect(serviceSource).toContain('name: string')
    expect(serviceSource).toContain('price: number')
    expect(serviceSource).toContain('startDate: string')
    expect(serviceSource).toContain('maxPerWallet: number')
  })

  test('MintPhase supports allowlist', () => {
    expect(serviceSource).toContain('allowlist?: string[]')
  })

  test('defines CreatorSplit interface', () => {
    expect(serviceSource).toContain('export interface CreatorSplit')
  })

  test('CreatorSplit has address and share', () => {
    expect(serviceSource).toContain('address: string')
    expect(serviceSource).toContain('share: number')
  })

  test('defines LaunchResult interface', () => {
    expect(serviceSource).toContain('export interface LaunchResult')
  })

  test('defines CreatorDashboardData interface', () => {
    expect(serviceSource).toContain('export interface CreatorDashboardData')
  })

  test('defines LaunchpadStats interface', () => {
    expect(serviceSource).toContain('export interface LaunchpadStats')
  })
})

describe('LaunchpadService methods', () => {
  test('has validateConfig method', () => {
    expect(serviceSource).toContain('validateConfig(config: LaunchpadConfig)')
  })

  test('has createLaunch method', () => {
    expect(serviceSource).toContain('async createLaunch(config: LaunchpadConfig)')
  })

  test('has getCreatorDashboard method', () => {
    expect(serviceSource).toContain('async getCreatorDashboard(collectionSlug: string)')
  })

  test('has getStats method', () => {
    expect(serviceSource).toContain('async getStats(): Promise<LaunchpadStats>')
  })

  test('has generateSlug method', () => {
    expect(serviceSource).toContain('generateSlug(name: string): string')
  })
})

describe('LaunchpadService validation rules', () => {
  test('validates name is required', () => {
    expect(serviceSource).toContain("'Collection name is required'")
  })

  test('validates symbol is required', () => {
    expect(serviceSource).toContain("'Collection symbol is required'")
  })

  test('validates symbol length', () => {
    expect(serviceSource).toContain("'Symbol must be 10 characters or less'")
  })

  test('validates supply range', () => {
    expect(serviceSource).toContain("'Supply must be at least 1'")
    expect(serviceSource).toContain('MAX_SUPPLY')
  })

  test('validates royalty range', () => {
    expect(serviceSource).toContain('sellerFeeBasisPoints')
    expect(serviceSource).toContain('10000')
  })

  test('validates phases exist', () => {
    expect(serviceSource).toContain("'At least one mint phase is required'")
  })

  test('validates max phases', () => {
    expect(serviceSource).toContain('MAX_PHASES')
  })

  test('validates creator shares total 100%', () => {
    expect(serviceSource).toContain('totalShare !== 100')
  })

  test('validates max creators', () => {
    expect(serviceSource).toContain('MAX_CREATORS')
  })
})

describe('LaunchpadService constants', () => {
  test('max supply is 100,000', () => {
    expect(serviceSource).toContain('MAX_SUPPLY = 100_000')
  })

  test('max phases is 10', () => {
    expect(serviceSource).toContain('MAX_PHASES = 10')
  })

  test('max creators is 5', () => {
    expect(serviceSource).toContain('MAX_CREATORS = 5')
  })
})

describe('LaunchpadService dashboard', () => {
  test('calculates mint progress percentage', () => {
    expect(serviceSource).toContain('mintProgress')
    expect(serviceSource).toContain('mintedCount / supply')
  })

  test('calculates primary sales revenue', () => {
    expect(serviceSource).toContain('primarySales')
  })

  test('calculates secondary royalties', () => {
    expect(serviceSource).toContain('secondaryRoyalties')
    expect(serviceSource).toContain('royaltyRate')
  })

  test('counts unique holders', () => {
    expect(serviceSource).toContain('uniqueHolders')
  })

  test('caches dashboard data', () => {
    expect(serviceSource).toContain('DASHBOARD_CACHE_TTL = 30')
    expect(serviceSource).toContain('creator_dashboard:')
  })
})

// ============================================
// Runtime tests
// ============================================

describe('LaunchpadService runtime - validation', () => {
  test('validates a valid config', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    const result = launchpadService.validateConfig({
      name: 'Test Collection',
      symbol: 'TEST',
      description: 'A test collection',
      supply: 1000,
      useCompressed: false,
      sellerFeeBasisPoints: 500,
      phases: [{ name: 'Public', price: 1, startDate: '2026-01-01', maxPerWallet: 5 }],
      creators: [{ address: 'wallet123', share: 100 }],
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('rejects missing name', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    const result = launchpadService.validateConfig({
      name: '',
      symbol: 'TEST',
      description: '',
      supply: 1000,
      useCompressed: false,
      sellerFeeBasisPoints: 500,
      phases: [{ name: 'Public', price: 1, startDate: '2026-01-01', maxPerWallet: 5 }],
      creators: [{ address: 'wallet123', share: 100 }],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => e.includes('name'))).toBe(true)
  })

  test('rejects supply > MAX_SUPPLY', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    const result = launchpadService.validateConfig({
      name: 'Test',
      symbol: 'T',
      description: '',
      supply: 200000,
      useCompressed: false,
      sellerFeeBasisPoints: 500,
      phases: [{ name: 'Public', price: 1, startDate: '2026-01-01', maxPerWallet: 5 }],
      creators: [{ address: 'wallet123', share: 100 }],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => e.includes('Supply'))).toBe(true)
  })

  test('rejects creator shares not totaling 100', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    const result = launchpadService.validateConfig({
      name: 'Test',
      symbol: 'T',
      description: '',
      supply: 100,
      useCompressed: false,
      sellerFeeBasisPoints: 500,
      phases: [{ name: 'Public', price: 1, startDate: '2026-01-01', maxPerWallet: 5 }],
      creators: [{ address: 'w1', share: 60 }, { address: 'w2', share: 30 }],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e: string) => e.includes('100%'))).toBe(true)
  })

  test('rejects no phases', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    const result = launchpadService.validateConfig({
      name: 'Test',
      symbol: 'T',
      description: '',
      supply: 100,
      useCompressed: false,
      sellerFeeBasisPoints: 500,
      phases: [],
      creators: [{ address: 'wallet123', share: 100 }],
    })
    expect(result.valid).toBe(false)
  })
})

describe('LaunchpadService runtime - slug generation', () => {
  test('generates slug from name', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    expect(launchpadService.generateSlug('Cool Hoodies Collection')).toBe('cool-hoodies-collection')
  })

  test('handles special characters', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    expect(launchpadService.generateSlug('My NFTs! @2026')).toBe('my-nfts-2026')
  })

  test('handles leading/trailing special chars', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    expect(launchpadService.generateSlug('---Test---')).toBe('test')
  })
})

describe('LaunchpadService runtime - constants', () => {
  test('getMaxSupply returns 100000', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    expect(launchpadService.getMaxSupply()).toBe(100000)
  })

  test('getMaxPhases returns 10', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    expect(launchpadService.getMaxPhases()).toBe(10)
  })

  test('getMaxCreators returns 5', async () => {
    const { launchpadService } = await import('../../../app/Services/LaunchpadService')
    expect(launchpadService.getMaxCreators()).toBe(5)
  })
})

// ============================================
// Actions
// ============================================

const createPath = 'app/Actions/Launchpad/CreateLaunchAction.ts'
const dashboardPath = 'app/Actions/Launchpad/CreatorDashboardAction.ts'

describe('CreateLaunchAction', () => {
  test('file exists', () => {
    expect(existsSync(createPath)).toBe(true)
  })

  const source = readFileSync(createPath, 'utf-8')

  test('is a POST method', () => {
    expect(source).toContain("method: 'POST'")
  })

  test('validates required fields', () => {
    expect(source).toContain("'name, symbol, supply, and creators are required'")
  })

  test('calls launchpadService.validateConfig', () => {
    expect(source).toContain('launchpadService.validateConfig')
  })

  test('calls launchpadService.createLaunch', () => {
    expect(source).toContain('launchpadService.createLaunch')
  })

  test('returns launchpadUrl on success', () => {
    expect(source).toContain('launchpadUrl')
  })
})

describe('CreatorDashboardAction', () => {
  test('file exists', () => {
    expect(existsSync(dashboardPath)).toBe(true)
  })

  const source = readFileSync(dashboardPath, 'utf-8')

  test('is a GET method', () => {
    expect(source).toContain("method: 'GET'")
  })

  test('returns stats when no slug', () => {
    expect(source).toContain('launchpadService.getStats()')
  })

  test('returns dashboard data when slug provided', () => {
    expect(source).toContain('launchpadService.getCreatorDashboard(slug)')
  })

  test('returns 404 for unknown collection', () => {
    expect(source).toContain("'Collection not found'")
    expect(source).toContain('404')
  })
})

// ============================================
// Routes
// ============================================

const routesSource = readFileSync('routes/api.ts', 'utf-8')

describe('Launchpad routes', () => {
  test('create launch route exists', () => {
    expect(routesSource).toContain("route.post('/create', 'Actions/Launchpad/CreateLaunchAction')")
  })

  test('dashboard route exists', () => {
    expect(routesSource).toContain("route.get('/dashboard', 'Actions/Launchpad/CreatorDashboardAction')")
  })

  test('collection dashboard route exists', () => {
    expect(routesSource).toContain("route.get('/dashboard/{slug}', 'Actions/Launchpad/CreatorDashboardAction')")
  })

  test('routes grouped under /launchpad', () => {
    expect(routesSource).toContain("prefix: '/launchpad'")
  })
})
