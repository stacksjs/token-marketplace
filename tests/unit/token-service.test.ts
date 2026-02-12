import { describe, expect, test, beforeAll } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify TokenService structure
// ============================================

const servicePath = 'app/Services/TokenService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('TokenService structure', () => {
  test('file exists', () => {
    expect(existsSync(servicePath)).toBe(true)
  })

  test('imports from ts-tokens, not hand-written types', () => {
    expect(serviceSource).toContain("from 'ts-tokens'")
    expect(serviceSource).toContain("from '../../config/tokens'")
  })

  test('uses single dynamic import pattern', () => {
    expect(serviceSource).toContain("await import('ts-tokens')")
    expect(serviceSource).toContain('let ts: any = null')
  })

  test('does not have let fn: any pattern', () => {
    expect(serviceSource).not.toContain('let tsCreateCandyMachine: any')
    expect(serviceSource).not.toContain('let tsListNFT: any')
    expect(serviceSource).not.toContain('let tsDelistNFT: any')
    expect(serviceSource).not.toContain('let tsMakeOffer: any')
    expect(serviceSource).not.toContain('let tsAcceptOffer: any')
    expect(serviceSource).not.toContain('let getFullNFTData: any')
    expect(serviceSource).not.toContain('let fetchOffChainMetadata: any')
  })

  test('does not have hand-written interface definitions', () => {
    // These were all manually defined before, now imported from ts-tokens
    expect(serviceSource).not.toMatch(/^export interface CandyMachineConfig\b/m)
    expect(serviceSource).not.toMatch(/^export interface CandyGuardConfig\b/m)
    expect(serviceSource).not.toMatch(/^export interface CandyMachineResult\b/m)
    expect(serviceSource).not.toMatch(/^export interface TokenConfig\b/m)
    expect(serviceSource).not.toMatch(/^export interface ConfigLine\b/m)
    expect(serviceSource).not.toMatch(/^export interface NFTMetadata\b/m)
    expect(serviceSource).not.toMatch(/^export interface AllowlistEntry\b/m)
    expect(serviceSource).not.toMatch(/^export interface CandyMachineOnChainInfo\b/m)
    expect(serviceSource).not.toMatch(/^export interface ListingResult\b/m)
    expect(serviceSource).not.toMatch(/^export interface OfferResult\b/m)
    expect(serviceSource).not.toMatch(/^export interface AuctionResult\b/m)
    expect(serviceSource).not.toMatch(/^export interface BidResult\b/m)
    expect(serviceSource).not.toMatch(/^export interface RoyaltyInfoResult\b/m)
  })

  test('only UnsignedTransaction is hand-defined', () => {
    expect(serviceSource).toContain('export interface UnsignedTransaction')
  })

  test('re-exports types from ts-tokens', () => {
    expect(serviceSource).toContain('export type {')
    expect(serviceSource).toContain('TokenConfig')
    expect(serviceSource).toContain('TransactionResult')
    expect(serviceSource).toContain('CandyMachineConfig')
  })
})

describe('TokenService methods', () => {
  // Candy Machine
  test('has createCandyMachine method', () => {
    expect(serviceSource).toContain('async createCandyMachine(')
  })

  test('has addConfigLines method', () => {
    expect(serviceSource).toContain('async addConfigLines(')
  })

  test('has getCandyMachineInfo (renamed from getCandyMachineOnChainInfo)', () => {
    expect(serviceSource).toContain('async getCandyMachineInfo(')
    expect(serviceSource).not.toContain('getCandyMachineOnChainInfo')
  })

  test('has guard methods', () => {
    expect(serviceSource).toContain('async addGuards(')
    expect(serviceSource).toContain('async updateGuards(')
    expect(serviceSource).toContain('async removeGuards(')
  })

  // NFT
  test('has createCollection (renamed from createOnChainCollection)', () => {
    expect(serviceSource).toContain('async createCollection(')
    expect(serviceSource).not.toContain('createOnChainCollection')
  })

  test('has createNFT (renamed from createOnChainNFT)', () => {
    expect(serviceSource).toContain('async createNFT(')
    expect(serviceSource).not.toContain('createOnChainNFT')
  })

  test('has getNFTData method', () => {
    expect(serviceSource).toContain('async getNFTData(')
  })

  test('has getNFTsByOwner method', () => {
    expect(serviceSource).toContain('async getNFTsByOwner(')
  })

  test('has getNFTsByCollection method', () => {
    expect(serviceSource).toContain('async getNFTsByCollection(')
  })

  test('has transferNFT method', () => {
    expect(serviceSource).toContain('async transferNFT(')
  })

  // Marketplace
  test('has listNFT (renamed from listNFTForSale)', () => {
    expect(serviceSource).toContain('async listNFT(')
    expect(serviceSource).not.toContain('listNFTForSale')
  })

  test('has delistNFT method', () => {
    expect(serviceSource).toContain('async delistNFT(')
  })

  test('has buyListedNFT method', () => {
    expect(serviceSource).toContain('async buyListedNFT(')
  })

  test('has makeOffer method', () => {
    expect(serviceSource).toContain('async makeOffer(')
  })

  test('has acceptOffer method', () => {
    expect(serviceSource).toContain('async acceptOffer(')
  })

  test('has cancelOffer method', () => {
    expect(serviceSource).toContain('async cancelOffer(')
  })

  test('has createAuction method', () => {
    expect(serviceSource).toContain('async createAuction(')
  })

  test('has placeBid method', () => {
    expect(serviceSource).toContain('async placeBid(')
  })

  test('has settleAuction method', () => {
    expect(serviceSource).toContain('async settleAuction(')
  })

  test('has cancelAuction method', () => {
    expect(serviceSource).toContain('async cancelAuction(')
  })

  test('has createEscrow method', () => {
    expect(serviceSource).toContain('async createEscrow(')
  })

  test('has settleEscrow method', () => {
    expect(serviceSource).toContain('async settleEscrow(')
  })

  test('has cancelEscrow method', () => {
    expect(serviceSource).toContain('async cancelEscrow(')
  })

  test('has getRoyaltyInfo method', () => {
    expect(serviceSource).toContain('async getRoyaltyInfo(')
  })

  test('has getActiveListings method (NEW)', () => {
    expect(serviceSource).toContain('async getActiveListings(')
  })

  // Token (Fungible) - NEW
  test('has createToken method (NEW)', () => {
    expect(serviceSource).toContain('async createToken(')
  })

  test('has mintTokens method (NEW)', () => {
    expect(serviceSource).toContain('async mintTokens(')
  })

  test('has transferTokens method (NEW)', () => {
    expect(serviceSource).toContain('async transferTokens(')
  })

  test('has getTokenInfo method (NEW)', () => {
    expect(serviceSource).toContain('async getTokenInfo(')
  })

  test('has getBalance method (NEW)', () => {
    expect(serviceSource).toContain('async getBalance(')
  })

  // Build Transaction methods (kept)
  test('has build*Transaction methods', () => {
    expect(serviceSource).toContain('async buildListTransaction(')
    expect(serviceSource).toContain('async buildBuyTransaction(')
    expect(serviceSource).toContain('async buildDelistTransaction(')
    expect(serviceSource).toContain('async buildMintTransaction(')
    expect(serviceSource).toContain('async buildAcceptOfferTransaction(')
    expect(serviceSource).toContain('async buildCancelAuctionTransaction(')
    expect(serviceSource).toContain('async buildCreateEscrowTransaction(')
    expect(serviceSource).toContain('async buildSettleEscrowTransaction(')
    expect(serviceSource).toContain('async buildCancelEscrowTransaction(')
  })

  // Storage
  test('has uploadMetadata method', () => {
    expect(serviceSource).toContain('async uploadMetadata(')
  })

  test('has uploadImage method', () => {
    expect(serviceSource).toContain('async uploadImage(')
  })

  // Merkle tree (kept)
  test('has Merkle tree methods', () => {
    expect(serviceSource).toContain('generateMerkleRoot(')
    expect(serviceSource).toContain('generateMerkleProof(')
    expect(serviceSource).toContain('verifyMerkleProof(')
  })
})

describe('Dead code removal', () => {
  test('removed getOnChainMetadata (redundant with getNFTData)', () => {
    expect(serviceSource).not.toContain('async getOnChainMetadata(')
  })

  test('removed getOffChainMetadata (redundant with getNFTData)', () => {
    expect(serviceSource).not.toContain('async getOffChainMetadata(')
  })

  test('removed getCandyMachineLoadedItems (info in getCandyMachineInfo)', () => {
    expect(serviceSource).not.toContain('getCandyMachineLoadedItems')
  })

  test('removed getCandyMachineMintedItems (info in getCandyMachineInfo)', () => {
    expect(serviceSource).not.toContain('getCandyMachineMintedItems')
  })

  test('removed uploadBatch (never used)', () => {
    expect(serviceSource).not.toContain('async uploadBatch(')
  })

  test('removed estimateStorageCost (never used)', () => {
    expect(serviceSource).not.toContain('estimateStorageCost')
  })

  test('removed mintFromCandyMachine server-signs version (only build version used)', () => {
    expect(serviceSource).not.toContain('async mintFromCandyMachine(')
  })

  test('removed mintWithGuard server-signs version', () => {
    expect(serviceSource).not.toContain('async mintWithGuard(')
  })
})

describe('TokenService exports', () => {
  test('exports getTokenService singleton', () => {
    expect(serviceSource).toContain('export function getTokenService()')
  })

  test('exports createTokenService factory', () => {
    expect(serviceSource).toContain('export function createTokenService()')
  })

  test('exports resetTokenService', () => {
    expect(serviceSource).toContain('export function resetTokenService()')
  })

  test('default exports TokenService class', () => {
    expect(serviceSource).toContain('export default TokenService')
  })
})

// ============================================
// Mock mode runtime tests
// ============================================

describe('TokenService mock mode', () => {
  let TokenService: any
  let getTokenService: any

  beforeAll(async () => {
    // Set mock mode before importing
    process.env.TOKENS_MOCK_MODE = 'true'
    const mod = await import('../../app/Services/TokenService')
    TokenService = mod.TokenService
    getTokenService = mod.getTokenService
  })

  test('getTokenService returns a singleton', () => {
    const svc1 = getTokenService()
    const svc2 = getTokenService()
    expect(svc1).toBe(svc2)
  })

  test('createCandyMachine returns mock data', async () => {
    const svc = getTokenService()
    const result = await svc.createCandyMachine({
      itemsAvailable: 100,
      symbol: 'TEST',
      collectionMint: 'FakeCollectionMint123456789012345678901234',
      creatorAddress: 'FakeCreator12345678901234567890123456789012',
    })
    expect(result.candyMachine).toBeDefined()
    expect(result.signature).toBeDefined()
    expect(typeof result.candyMachine).toBe('string')
    expect(result.candyMachine.length).toBe(44)
  })

  test('getNFTData returns mock data', async () => {
    const svc = getTokenService()
    const result = await svc.getNFTData('FakeMintAddress1234567890123456789012345678')
    expect(result.mint).toBe('FakeMintAddress1234567890123456789012345678')
    expect(result.owner).toBeDefined()
    expect(result.metadata).toBeDefined()
    expect(result.offChainMetadata).toBeDefined()
  })

  test('listNFT returns mock listing', async () => {
    const svc = getTokenService()
    const result = await svc.listNFT('FakeMint12345678901234567890123456789012', BigInt(1000000000))
    expect(result.id).toBeDefined()
    expect(result.mint).toBe('FakeMint12345678901234567890123456789012')
    expect(result.price).toBe(BigInt(1000000000))
    expect(result.delegated).toBe(true)
  })

  test('makeOffer returns mock offer', async () => {
    const svc = getTokenService()
    const result = await svc.makeOffer('FakeMint12345678901234567890123456789012', BigInt(500000000))
    expect(result.id).toBeDefined()
    expect(result.status).toBe('active')
    expect(result.price).toBe(BigInt(500000000))
  })

  test('createAuction returns mock auction', async () => {
    const svc = getTokenService()
    const result = await svc.createAuction('FakeMint12345678901234567890123456789012', {
      type: 'english',
      startPrice: BigInt(1000000000),
      duration: 3600,
    })
    expect(result.id).toBeDefined()
    expect(result.type).toBe('english')
    expect(result.status).toBe('active')
  })

  test('createToken returns mock data', async () => {
    const svc = getTokenService()
    const result = await svc.createToken({
      name: 'Test Token',
      symbol: 'TST',
      decimals: 9,
    })
    expect(result.mint).toBeDefined()
    expect(result.signature).toBeDefined()
  })

  test('mintTokens returns mock data', async () => {
    const svc = getTokenService()
    const result = await svc.mintTokens({
      mintAddress: 'FakeMint12345678901234567890123456789012',
      amount: 1000,
      destinationWallet: 'FakeWallet123456789012345678901234567890',
    })
    expect(result.signature).toBeDefined()
    expect(result.amount).toBe(1000)
    expect(result.destination).toBe('FakeWallet123456789012345678901234567890')
  })

  test('getBalance returns mock data', async () => {
    const svc = getTokenService()
    const result = await svc.getBalance('FakeWallet123456789012345678901234567890')
    expect(typeof result.sol).toBe('number')
    expect(typeof result.lamports).toBe('number')
    expect(result.sol).toBeGreaterThanOrEqual(0)
  })

  test('getTokenInfo returns mock data', async () => {
    const svc = getTokenService()
    const result = await svc.getTokenInfo('FakeMint12345678901234567890123456789012')
    expect(result.mint).toBe('FakeMint12345678901234567890123456789012')
    expect(result.decimals).toBe(9)
    expect(typeof result.holders).toBe('number')
  })

  test('buildListTransaction returns unsigned transaction', async () => {
    const svc = getTokenService()
    const result = await svc.buildListTransaction(
      'FakeMint12345678901234567890123456789012',
      BigInt(2000000000),
      'FakeSeller12345678901234567890123456789012',
    )
    expect(result.serializedTransaction).toBeDefined()
    expect(result.message).toContain('List NFT for')
  })

  test('generateMerkleRoot works correctly', () => {
    const svc = getTokenService()
    const addresses = ['addr1', 'addr2', 'addr3']
    const root = svc.generateMerkleRoot(addresses)
    expect(root).toBeInstanceOf(Uint8Array)
    expect(root.length).toBe(32)
  })

  test('verifyMerkleProof validates correctly', () => {
    const svc = getTokenService()
    const addresses = ['addr1', 'addr2', 'addr3', 'addr4']
    const root = svc.generateMerkleRoot(addresses)
    const { proof, leaf } = svc.generateMerkleProof('addr2', addresses)
    expect(svc.verifyMerkleProof(proof, leaf, root)).toBe(true)
  })
})
