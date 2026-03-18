/**
 * Database Migration Tests
 *
 * Verifies all migration files exist and contain valid SQL structure.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync, readdirSync } from 'fs'

const migrationsDir = 'database/migrations'

describe('Migration files', () => {
  test('migrations directory exists', () => {
    expect(existsSync(migrationsDir)).toBe(true)
  })

  test('all expected migration files exist', () => {
    const files = readdirSync(migrationsDir)
    expect(files.length).toBeGreaterThanOrEqual(20)
  })

  test('all files are .sql', () => {
    const files = readdirSync(migrationsDir)
    for (const file of files) {
      expect(file.endsWith('.sql')).toBe(true)
    }
  })

  test('files follow naming convention (timestamp-description.sql)', () => {
    const files = readdirSync(migrationsDir)
    const pattern = /^\d+-[\w-]+\.sql$/
    for (const file of files) {
      expect(pattern.test(file)).toBe(true)
    }
  })
})

describe('Collections migration', () => {
  const path = `${migrationsDir}/1770353226-create-collections-table.sql`

  test('creates collections table', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain('collections')
  })

  test('has required columns', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain('"name"')
    expect(sql).toContain('"slug"')
    expect(sql).toContain('"created_at"')
  })

  test('has id as primary key', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain('PRIMARY KEY')
  })
})

describe('NFTs migration', () => {
  const path = `${migrationsDir}/1770353229-create-nfts-table.sql`

  test('creates nfts table', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain('nfts')
  })

  test('has collection_id column', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain('collection_id')
  })
})

describe('Offers migration', () => {
  const path = `${migrationsDir}/1770353234-create-offers-table.sql`

  test('creates offers table with required columns', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain('"nft_id"')
    expect(sql).toContain('"amount"')
    expect(sql).toContain('"status"')
    expect(sql).toContain('"buyer_wallet_address"')
  })

  test('has foreign key to nfts', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain('FOREIGN KEY')
    expect(sql).toContain('nfts')
  })

  test('has default currency of SOL', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain("DEFAULT 'SOL'")
  })
})

describe('Auctions migration', () => {
  const path = `${migrationsDir}/1770353235-create-auctions-table.sql`

  test('creates auctions table', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain('auctions')
  })
})

describe('Bids migration', () => {
  const path = `${migrationsDir}/1770353236-create-bids-table.sql`

  test('creates bids table', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain('bids')
  })
})

describe('Platform fees migration', () => {
  const path = `${migrationsDir}/1770353241-create-platform-fees-table.sql`

  test('creates platform_fees table', () => {
    const sql = readFileSync(path, 'utf-8')
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain('platform_fees')
  })
})

describe('Multisig migrations', () => {
  test('multisig accounts table exists', () => {
    const sql = readFileSync(`${migrationsDir}/1770353243-create-multisig-accounts-table.sql`, 'utf-8')
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain('multisig_accounts')
  })

  test('multisig transactions table exists', () => {
    const sql = readFileSync(`${migrationsDir}/1770353244-create-multisig-transactions-table.sql`, 'utf-8')
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain('multisig_transactions')
  })

  test('multisig signatures table exists', () => {
    const sql = readFileSync(`${migrationsDir}/1770353245-create-multisig-signatures-table.sql`, 'utf-8')
    expect(sql).toContain('CREATE TABLE')
    expect(sql).toContain('multisig_signatures')
  })
})

describe('Index migrations', () => {
  test('collections slug unique index', () => {
    const sql = readFileSync(`${migrationsDir}/1770353231-create-collections_slug_unique-index-in-collections.sql`, 'utf-8')
    expect(sql.toLowerCase()).toContain('index')
    expect(sql).toContain('slug')
  })

  test('candy machine address unique index', () => {
    const sql = readFileSync(`${migrationsDir}/1770353232-create-candy_machines_candy_machine_address_unique-index-in-candy_machines.sql`, 'utf-8')
    expect(sql.toLowerCase()).toContain('index')
    expect(sql).toContain('candy_machine_address')
  })

  test('mint transaction signature unique index', () => {
    const sql = readFileSync(`${migrationsDir}/1770353233-create-mint_transactions_transaction_signature_unique-index-in-mint_transactions.sql`, 'utf-8')
    expect(sql.toLowerCase()).toContain('index')
    expect(sql).toContain('transaction_signature')
  })
})

describe('Alter table migrations', () => {
  test('listing fields added to nfts', () => {
    const sql = readFileSync(`${migrationsDir}/1770353237-add-listing-fields-to-nfts.sql`, 'utf-8')
    expect(sql).toContain('ALTER TABLE')
    expect(sql).toContain('nfts')
  })

  test('wallet added to users', () => {
    const sql = readFileSync(`${migrationsDir}/1770353238-add-wallet-to-users.sql`, 'utf-8')
    expect(sql).toContain('ALTER TABLE')
  })

  test('marketplace stats added to collections', () => {
    const sql = readFileSync(`${migrationsDir}/1770353239-add-marketplace-stats-to-collections.sql`, 'utf-8')
    expect(sql).toContain('ALTER TABLE')
    expect(sql).toContain('collections')
  })
})
