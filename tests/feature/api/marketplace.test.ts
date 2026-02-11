import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const actionsPath = join(process.cwd(), 'storage/framework/defaults/app/Actions/Marketplace')

describe('Marketplace API Actions', () => {
  describe('HomePageDataAction', () => {
    const actionPath = join(actionsPath, 'HomePageDataAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Home Page Data'")
    })

    test('uses GET method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'GET'")
    })

    test('returns JSON response', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('response.json(')
    })

    test('returns featuredCollections', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('featuredCollections')
    })

    test('returns popularCollections', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('popularCollections')
    })

    test('returns availableNfts', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('availableNfts')
    })

    test('returns stats', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('stats')
    })
  })

  describe('CollectionIndexAction', () => {
    const actionPath = join(actionsPath, 'CollectionIndexAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Collection Index'")
    })

    test('uses GET method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'GET'")
    })

    test('returns collections array', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('collections')
      expect(content).toContain('response.json({ collections })')
    })
  })

  describe('CollectionShowAction', () => {
    const actionPath = join(actionsPath, 'CollectionShowAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Collection Show'")
    })

    test('uses GET method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'GET'")
    })

    test('gets slug from request params', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("getParam('slug')")
    })

    test('handles not found', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Collection not found')
      expect(content).toContain('404')
    })
  })

  describe('NftIndexAction', () => {
    const actionPath = join(actionsPath, 'NftIndexAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'NFT Index'")
    })

    test('uses GET method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'GET'")
    })
  })

  describe('NftShowAction', () => {
    const actionPath = join(actionsPath, 'NftShowAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'NFT Show'")
    })

    test('uses GET method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'GET'")
    })

    test('gets id from request params', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("getParam('id')")
    })

    test('handles not found', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('NFT not found')
      expect(content).toContain('404')
    })
  })

  describe('RarityIndexAction', () => {
    const actionPath = join(actionsPath, 'RarityIndexAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Rarity Index'")
    })

    test('uses GET method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'GET'")
    })

    test('returns collections with rarity data', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('collections')
      expect(content).toContain('response.json({ collections })')
    })
  })

  describe('RarityShowAction', () => {
    const actionPath = join(actionsPath, 'RarityShowAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Rarity Show'")
    })

    test('uses GET method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'GET'")
    })

    test('gets slug from request params', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("getParam('slug')")
    })

    test('handles not found', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Collection not found')
      expect(content).toContain('404')
    })

    test('returns rarity distribution data', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('rarityDistribution')
    })
  })
})

describe('Marketplace API Routes', () => {
  const routesPath = join(process.cwd(), 'routes/api.ts')

  test('routes file exists', () => {
    expect(existsSync(routesPath)).toBe(true)
  })

  test('has marketplace route group', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("prefix: '/marketplace'")
  })

  test('has home page data route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.get('/home', 'Actions/Marketplace/HomePageDataAction')")
  })

  test('has collections routes', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.get('/collections', 'Actions/Marketplace/CollectionIndexAction')")
    expect(content).toContain("route.get('/collections/{slug}', 'Actions/Marketplace/CollectionShowAction')")
  })

  test('has NFT routes', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.get('/nfts', 'Actions/Marketplace/NftIndexAction')")
    expect(content).toContain("route.get('/nfts/{id}', 'Actions/Marketplace/NftShowAction')")
  })

  test('has rarity routes', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.get('/rarity', 'Actions/Marketplace/RarityIndexAction')")
    expect(content).toContain("route.get('/rarity/{slug}', 'Actions/Marketplace/RarityShowAction')")
  })
})

describe('Marketplace Models', () => {
  describe('Collection Model', () => {
    const modelPath = join(process.cwd(), 'storage/framework/models/Collection.ts')

    test('model file exists', () => {
      expect(existsSync(modelPath)).toBe(true)
    })

    test('has required fields', () => {
      const content = readFileSync(modelPath, 'utf-8')
      expect(content).toContain('name:')
      expect(content).toContain('slug:')
      expect(content).toContain('description:')
      expect(content).toContain('imageUrl:')
    })

    test('has boolean flags', () => {
      const content = readFileSync(modelPath, 'utf-8')
      expect(content).toContain('isLive:')
      expect(content).toContain('isFeatured:')
      expect(content).toContain('isMinting:')
    })
  })

  describe('Nft Model', () => {
    const modelPath = join(process.cwd(), 'storage/framework/models/Nft.ts')

    test('model file exists', () => {
      expect(existsSync(modelPath)).toBe(true)
    })

    test('has required fields', () => {
      const content = readFileSync(modelPath, 'utf-8')
      expect(content).toContain('name:')
      expect(content).toContain('tokenId:')
      expect(content).toContain('imageUrl:')
      expect(content).toContain('price:')
    })

    test('has collection relationship', () => {
      const content = readFileSync(modelPath, 'utf-8')
      expect(content).toContain('belongsTo')
      expect(content).toContain('Collection')
    })
  })
})

describe('Marketplace Migrations', () => {
  const migrationsPath = join(process.cwd(), 'database/migrations')

  test('collections table migration exists', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const collectionMigration = files.find((f: string) => f.includes('create-collections-table'))
    expect(collectionMigration).toBeDefined()
  })

  test('nfts table migration exists', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const nftMigration = files.find((f: string) => f.includes('create-nfts-table'))
    expect(nftMigration).toBeDefined()
  })

  test('collections migration has correct schema', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const collectionMigration = files.find((f: string) => f.includes('create-collections-table'))
    const content = readFileSync(join(migrationsPath, collectionMigration), 'utf-8')
    expect(content).toContain('CREATE TABLE')
    expect(content).toContain('collections')
    expect(content).toContain('name')
    expect(content).toContain('slug')
  })

  test('nfts migration has correct schema', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const nftMigration = files.find((f: string) => f.includes('create-nfts-table'))
    const content = readFileSync(join(migrationsPath, nftMigration), 'utf-8')
    expect(content).toContain('CREATE TABLE')
    expect(content).toContain('nfts')
    expect(content).toContain('collection_id')
    expect(content).toContain('FOREIGN KEY')
  })

  test('offers table migration exists', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const offersMigration = files.find((f: string) => f.includes('create-offers-table'))
    expect(offersMigration).toBeDefined()
  })

  test('auctions table migration exists', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const auctionsMigration = files.find((f: string) => f.includes('create-auctions-table'))
    expect(auctionsMigration).toBeDefined()
  })

  test('bids table migration exists', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const bidsMigration = files.find((f: string) => f.includes('create-bids-table'))
    expect(bidsMigration).toBeDefined()
  })

  test('offers migration has correct schema', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const migration = files.find((f: string) => f.includes('create-offers-table'))
    const content = readFileSync(join(migrationsPath, migration), 'utf-8')
    expect(content).toContain('CREATE TABLE')
    expect(content).toContain('offers')
    expect(content).toContain('nft_id')
    expect(content).toContain('buyer_wallet_address')
    expect(content).toContain('amount')
    expect(content).toContain('status')
  })

  test('auctions migration has correct schema', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const migration = files.find((f: string) => f.includes('create-auctions-table'))
    const content = readFileSync(join(migrationsPath, migration), 'utf-8')
    expect(content).toContain('CREATE TABLE')
    expect(content).toContain('auctions')
    expect(content).toContain('nft_id')
    expect(content).toContain('auction_type')
    expect(content).toContain('starting_price')
    expect(content).toContain('status')
  })

  test('bids migration has correct schema', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const migration = files.find((f: string) => f.includes('create-bids-table'))
    const content = readFileSync(join(migrationsPath, migration), 'utf-8')
    expect(content).toContain('CREATE TABLE')
    expect(content).toContain('bids')
    expect(content).toContain('auction_id')
    expect(content).toContain('bidder_wallet_address')
    expect(content).toContain('amount')
  })

  test('nfts migration has listing fields', () => {
    const files = require('fs').readdirSync(migrationsPath)
    const migration = files.find((f: string) => f.includes('add-listing-fields-to-nfts'))
    expect(migration).toBeDefined()
    const content = readFileSync(join(migrationsPath, migration), 'utf-8')
    expect(content).toContain('listing_id')
    expect(content).toContain('delegate_address')
    expect(content).toContain('listing_price')
  })
})
