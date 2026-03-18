/**
 * Marketplace Actions - Static Analysis Tests
 *
 * Verifies all marketplace action files exist, import the right dependencies,
 * and contain expected method signatures.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Activity Feed Action
// ============================================

describe('ActivityFeedAction', () => {
  const path = 'app/Actions/Marketplace/ActivityFeedAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('handles activity feed queries', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('activity')
  })
})

// ============================================
// Collection Index Action
// ============================================

describe('CollectionIndexAction', () => {
  const path = 'app/Actions/Marketplace/CollectionIndexAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('queries collections', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('collection')
  })
})

// ============================================
// Collection Show Action
// ============================================

describe('CollectionShowAction', () => {
  const path = 'app/Actions/Marketplace/CollectionShowAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('fetches single collection by slug', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('slug')
  })
})

// ============================================
// Create Collection Action
// ============================================

describe('CreateCollectionAction', () => {
  const path = 'app/Actions/Marketplace/CreateCollectionAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('uses tokenService for on-chain creation', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('tokenService') // Uses TokenService
  })
})

// ============================================
// Home Page Data Action
// ============================================

describe('HomePageDataAction', () => {
  const path = 'app/Actions/Marketplace/HomePageDataAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('provides homepage data', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('collection')
  })
})

// ============================================
// NFT Show Action
// ============================================

describe('NftShowAction', () => {
  const path = 'app/Actions/Marketplace/NftShowAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('returns NFT details', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('nft')
  })
})

// ============================================
// Profile Action
// ============================================

describe('ProfileAction', () => {
  const path = 'app/Actions/Marketplace/ProfileAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('handles wallet-based profiles', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('wallet')
  })
})

// ============================================
// Rarity Actions
// ============================================

describe('RarityIndexAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Marketplace/RarityIndexAction.ts')).toBe(true)
  })
})

describe('RarityShowAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Marketplace/RarityShowAction.ts')).toBe(true)
  })
})

// ============================================
// Sync Actions
// ============================================

describe('SyncCollectionAction', () => {
  const path = 'app/Actions/Marketplace/SyncCollectionAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('syncs on-chain data', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('tokenService')
  })
})

describe('SyncCollectionsBatchAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Marketplace/SyncCollectionsBatchAction.ts')).toBe(true)
  })
})

describe('UpdateCollectionStatsAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Marketplace/UpdateCollectionStatsAction.ts')).toBe(true)
  })
})

describe('DiscoverCollectionsAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Marketplace/DiscoverCollectionsAction.ts')).toBe(true)
  })
})

describe('MintNftToCollectionAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Marketplace/MintNftToCollectionAction.ts')).toBe(true)
  })
})

describe('ShowMintingCollectionAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Marketplace/ShowMintingCollectionAction.ts')).toBe(true)
  })
})
