import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

const migrationsDir = 'database/migrations'

describe('Indexer migration files exist', () => {
  test('nft_traits table migration exists', () => {
    expect(existsSync(`${migrationsDir}/1770353247-create-nft-traits-table.sql`)).toBe(true)
  })

  test('marketplace_events table migration exists', () => {
    expect(existsSync(`${migrationsDir}/1770353248-create-marketplace-events-table.sql`)).toBe(true)
  })

  test('indexer fields migration exists', () => {
    expect(existsSync(`${migrationsDir}/1770353249-add-indexer-fields-to-nfts.sql`)).toBe(true)
  })
})

describe('nft_traits migration', () => {
  const sql = readFileSync(`${migrationsDir}/1770353247-create-nft-traits-table.sql`, 'utf-8')

  test('creates nft_traits table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "nft_traits"')
  })

  test('has required columns', () => {
    expect(sql).toContain('"id" INTEGER PRIMARY KEY AUTOINCREMENT')
    expect(sql).toContain('"mint_address" TEXT NOT NULL')
    expect(sql).toContain('"collection_id" INTEGER NOT NULL')
    expect(sql).toContain('"trait_type" TEXT NOT NULL')
    expect(sql).toContain('"trait_value" TEXT NOT NULL')
    expect(sql).toContain('"created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP')
  })

  test('has unique constraint on mint + trait_type', () => {
    expect(sql).toContain('uq_nft_traits_mint_trait')
    expect(sql).toContain('"mint_address", "trait_type"')
  })

  test('has composite index for collection + type + value', () => {
    expect(sql).toContain('idx_nft_traits_collection_type_value')
    expect(sql).toContain('"collection_id", "trait_type", "trait_value"')
  })

  test('has index on mint_address', () => {
    expect(sql).toContain('idx_nft_traits_mint')
  })
})

describe('marketplace_events migration', () => {
  const sql = readFileSync(`${migrationsDir}/1770353248-create-marketplace-events-table.sql`, 'utf-8')

  test('creates marketplace_events table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "marketplace_events"')
  })

  test('has required columns', () => {
    expect(sql).toContain('"id" INTEGER PRIMARY KEY AUTOINCREMENT')
    expect(sql).toContain('"type" TEXT NOT NULL')
    expect(sql).toContain('"nft_id" INTEGER')
    expect(sql).toContain('"nft_mint" TEXT')
    expect(sql).toContain('"collection_id" INTEGER')
    expect(sql).toContain('"from_wallet" TEXT')
    expect(sql).toContain('"to_wallet" TEXT')
    expect(sql).toContain('"price" REAL')
    expect(sql).toContain('"currency" TEXT DEFAULT')
    expect(sql).toContain('"source" TEXT DEFAULT')
    expect(sql).toContain('"tx_signature" TEXT')
    expect(sql).toContain('"created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP')
  })

  test('has indexes for querying', () => {
    expect(sql).toContain('idx_marketplace_events_type')
    expect(sql).toContain('idx_marketplace_events_collection')
    expect(sql).toContain('idx_marketplace_events_nft_mint')
    expect(sql).toContain('idx_marketplace_events_created')
    expect(sql).toContain('idx_marketplace_events_from_wallet')
    expect(sql).toContain('idx_marketplace_events_to_wallet')
  })

  test('defaults currency to SOL', () => {
    expect(sql).toContain("DEFAULT 'SOL'")
  })

  test('defaults source to hoodies', () => {
    expect(sql).toContain("DEFAULT 'hoodies'")
  })
})

describe('indexer fields migration', () => {
  const sql = readFileSync(`${migrationsDir}/1770353249-add-indexer-fields-to-nfts.sql`, 'utf-8')

  test('adds is_compressed column', () => {
    expect(sql).toContain('"is_compressed" INTEGER DEFAULT 0')
  })

  test('adds tree_address column', () => {
    expect(sql).toContain('"tree_address" TEXT')
  })

  test('adds leaf_index column', () => {
    expect(sql).toContain('"leaf_index" INTEGER')
  })

  test('adds indexed_at column', () => {
    expect(sql).toContain('"indexed_at" TEXT')
  })

  test('adds status column with default', () => {
    expect(sql).toContain('"status" TEXT DEFAULT')
  })

  test('has index on status', () => {
    expect(sql).toContain('idx_nfts_status')
  })

  test('has composite index on owner + collection', () => {
    expect(sql).toContain('idx_nfts_owner_collection')
    expect(sql).toContain('"owner_wallet_address", "collection_id"')
  })

  test('has composite index on status + listing_price', () => {
    expect(sql).toContain('idx_nfts_status_listing_price')
    expect(sql).toContain('"status", "listing_price"')
  })

  test('has index on name for search', () => {
    expect(sql).toContain('idx_nfts_name')
    expect(sql).toContain('"name"')
  })
})
