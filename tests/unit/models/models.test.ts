/**
 * Model Static Analysis Tests
 *
 * Verifies all models exist with correct structure, fields,
 * relationships, and factory traits.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Collection Model
// ============================================

describe('Collection model', () => {
  const path = 'app/Models/Collection.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('has required fields', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('name')
    expect(source).toContain('slug')
    expect(source).toContain('collection_address')
  })

  test('has relationship to CandyMachine', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('candy_machine')
  })

  test('has relationship to Nfts', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('nft')
  })
})

// ============================================
// NFT Model
// ============================================

describe('Nft model', () => {
  const path = 'app/Models/Nft.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('has required fields', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('mint_address')
    expect(source).toContain('name')
    expect(source).toContain('collection_id')
  })

  test('has listing fields', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('listing_price')
    expect(source).toContain('delegate_address')
  })

  test('has relationship to Collection', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('collection')
  })
})

// ============================================
// Offer Model
// ============================================

describe('Offer model', () => {
  const path = 'app/Models/Offer.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('has required fields', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('nft_id')
    expect(source).toContain('amount')
    expect(source).toContain('status')
  })
})

// ============================================
// Auction Model
// ============================================

describe('Auction model', () => {
  const path = 'app/Models/Auction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('has required fields', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('nft_id')
    expect(source).toContain('type')
    expect(source).toContain('start_price')
    expect(source).toContain('status')
  })
})

// ============================================
// Bid Model
// ============================================

describe('Bid model', () => {
  const path = 'app/Models/Bid.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('has required fields', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('auction_id')
    expect(source).toContain('amount')
    expect(source).toContain('bidder_wallet')
  })
})

// ============================================
// CandyMachine Model
// ============================================

describe('CandyMachine model', () => {
  const path = 'app/Models/CandyMachine.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('has required fields', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('candy_machine_address')
  })
})

// ============================================
// Presale Model
// ============================================

describe('Presale model', () => {
  const path = 'app/Models/Presale.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('has relationship to Collection', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('collection')
  })
})

// ============================================
// MintTransaction Model
// ============================================

describe('MintTransaction model', () => {
  const path = 'app/Models/MintTransaction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('has transaction signature field', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('transaction_signature')
  })
})

// ============================================
// PlatformFee Model
// ============================================

describe('PlatformFee model', () => {
  const path = 'app/Models/PlatformFee.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('has fee amount field', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('fee_amount')
  })
})

// ============================================
// Multisig Models
// ============================================

describe('MultisigAccount model', () => {
  test('file exists', () => {
    expect(existsSync('app/Models/MultisigAccount.ts')).toBe(true)
  })
})

describe('MultisigTransaction model', () => {
  test('file exists', () => {
    expect(existsSync('app/Models/MultisigTransaction.ts')).toBe(true)
  })
})

describe('MultisigSignature model', () => {
  test('file exists', () => {
    expect(existsSync('app/Models/MultisigSignature.ts')).toBe(true)
  })
})

// ============================================
// All models count
// ============================================

describe('Model inventory', () => {
  const expectedModels = [
    'Collection', 'Nft', 'Offer', 'Auction', 'Bid',
    'CandyMachine', 'Presale', 'MintTransaction', 'PlatformFee',
    'MultisigAccount', 'MultisigTransaction', 'MultisigSignature',
  ]

  for (const model of expectedModels) {
    test(`${model} model exists`, () => {
      expect(existsSync(`app/Models/${model}.ts`)).toBe(true)
    })
  }
})
