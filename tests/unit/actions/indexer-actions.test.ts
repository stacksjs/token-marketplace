import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

const actionsDir = 'app/Actions/Indexer'

describe('Indexer action files exist', () => {
  test('IndexerStatusAction exists', () => {
    expect(existsSync(`${actionsDir}/IndexerStatusAction.ts`)).toBe(true)
  })

  test('TraitCountsAction exists', () => {
    expect(existsSync(`${actionsDir}/TraitCountsAction.ts`)).toBe(true)
  })

  test('MarketplaceEventsAction exists', () => {
    expect(existsSync(`${actionsDir}/MarketplaceEventsAction.ts`)).toBe(true)
  })
})

describe('IndexerStatusAction', () => {
  const source = readFileSync(`${actionsDir}/IndexerStatusAction.ts`, 'utf-8')

  test('follows Action pattern', () => {
    expect(source).toContain("import { Action } from '@stacksjs/actions'")
    expect(source).toContain("import { db } from '@stacksjs/database'")
    expect(source).toContain("import { response } from '@stacksjs/router'")
    expect(source).toContain('export default new Action(')
  })

  test('is a GET endpoint', () => {
    expect(source).toContain("method: 'GET'")
  })

  test('imports TransactionListenerService', () => {
    expect(source).toContain('txListenerService')
  })

  test('imports CacheService', () => {
    expect(source).toContain('cache')
  })

  test('returns indexer stats', () => {
    expect(source).toContain('indexedNfts')
    expect(source).toContain('indexedTraits')
    expect(source).toContain('marketplaceEvents')
  })

  test('returns listener stats', () => {
    expect(source).toContain('listenerStats')
  })

  test('returns cache stats', () => {
    expect(source).toContain('cacheStats')
  })

  test('handles missing tables gracefully', () => {
    const catchCount = (source.match(/catch\s*\{/g) || []).length
    expect(catchCount).toBeGreaterThanOrEqual(3)
  })
})

describe('TraitCountsAction', () => {
  const source = readFileSync(`${actionsDir}/TraitCountsAction.ts`, 'utf-8')

  test('follows Action pattern', () => {
    expect(source).toContain("import { Action } from '@stacksjs/actions'")
    expect(source).toContain('export default new Action(')
  })

  test('is a GET endpoint', () => {
    expect(source).toContain("method: 'GET'")
  })

  test('imports IndexerService', () => {
    expect(source).toContain('indexerService')
  })

  test('looks up collection by slug', () => {
    expect(source).toContain("request.getParam('slug')")
    expect(source).toContain("where('slug', '=', slug)")
  })

  test('falls back to slug matching by name', () => {
    expect(source).toContain('generateSlug(c.name)')
  })

  test('returns 404 for missing collection', () => {
    expect(source).toContain('response.notFound')
  })

  test('calls indexerService.getTraitCounts', () => {
    expect(source).toContain('indexerService.getTraitCounts(db, collection.id)')
  })

  test('groups traits by type', () => {
    expect(source).toContain('grouped[trait.traitType]')
  })
})

describe('MarketplaceEventsAction', () => {
  const source = readFileSync(`${actionsDir}/MarketplaceEventsAction.ts`, 'utf-8')

  test('follows Action pattern', () => {
    expect(source).toContain("import { Action } from '@stacksjs/actions'")
    expect(source).toContain('export default new Action(')
  })

  test('is a GET endpoint', () => {
    expect(source).toContain("method: 'GET'")
  })

  test('supports type filter', () => {
    expect(source).toContain("request.getParam('type')")
  })

  test('supports collectionId filter', () => {
    expect(source).toContain("request.getParam('collectionId')")
  })

  test('supports wallet filter', () => {
    expect(source).toContain("request.getParam('wallet')")
  })

  test('supports cursor pagination', () => {
    expect(source).toContain("request.getParam('cursor')")
    expect(source).toContain('nextCursor')
  })

  test('clamps limit to max 100', () => {
    expect(source).toContain('Math.min(100')
  })

  test('calls indexerService.getEvents', () => {
    expect(source).toContain('indexerService.getEvents(db')
  })
})

describe('Indexer routes', () => {
  const routesSource = readFileSync('routes/api.ts', 'utf-8')

  test('has indexer status route', () => {
    expect(routesSource).toContain("'/indexer/status'")
    expect(routesSource).toContain('IndexerStatusAction')
  })

  test('has trait counts route', () => {
    expect(routesSource).toContain("'/indexer/traits/{slug}'")
    expect(routesSource).toContain('TraitCountsAction')
  })

  test('has marketplace events route', () => {
    expect(routesSource).toContain("'/indexer/events'")
    expect(routesSource).toContain('MarketplaceEventsAction')
  })
})
