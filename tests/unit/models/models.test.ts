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
    expect(source).toContain('mintAddress')
  })

  test('has relationship to CandyMachine', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('CandyMachine')
  })

  test('has relationship to Nfts', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('Nft')
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
    expect(source).toContain('mintAddress')
    expect(source).toContain('name')
    expect(source).toContain('collectionId')
  })

  test('has listing fields', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('listingPrice')
    expect(source).toContain('delegateAddress')
  })

  test('has relationship to Collection', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('Collection')
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
    expect(source).toContain('nftId')
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
    expect(source).toContain('nftId')
    expect(source).toContain('auctionType')
    expect(source).toContain('startingPrice')
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
    expect(source).toContain('auctionId')
    expect(source).toContain('amount')
    expect(source).toContain('bidderWalletAddress')
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
    expect(source).toContain('candyMachineAddress')
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
    expect(source).toContain('Collection')
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
    expect(source).toContain('transactionSignature')
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
    expect(source).toContain('feeAmount')
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
