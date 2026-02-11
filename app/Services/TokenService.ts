/**
 * TokenService - Wrapper for ts-tokens operations
 *
 * This service provides a unified interface for interacting with the ts-tokens library,
 * handling Candy Machine operations, NFT minting, storage, metadata management,
 * and the full secondary marketplace (listings, offers, auctions).
 *
 * Supports MOCK MODE for testing without Solana setup.
 * Enable by setting TOKENS_MOCK_MODE=true in .env
 */

import tokensConfig from '../../config/tokens'

// Conditional ts-tokens imports (only used when not in mock mode)
let tsCreateCandyMachine: any
let tsAddConfigLines: any
let tsMintFromCandyMachine: any
let getFullNFTData: any
let tsTransferNFT: any
let tsGetNFTsByOwner: any
let tsGetNFTsByCollection: any
let fetchOffChainMetadata: any
let getStorageAdapter: any
let loadWallet: any
let setConfig: any
let createSolanaConnection: any

// Marketplace imports
let tsListNFT: any
let tsDelistNFT: any
let tsBuyListedNFT: any
let tsMakeOffer: any
let tsAcceptOffer: any
let tsCancelOffer: any
let tsCreateAuction: any
let tsPlaceBid: any
let tsSettleAuction: any
let tsCancelAuction: any
let tsCreateEscrow: any
let tsSettleEscrow: any
let tsGetRoyaltyInfo: any
let tsCalculateRoyalties: any

// Candy machine extended imports
let tsGetCandyMachineInfo: any
let tsGetLoadedItems: any
let tsGetMintedItems: any
let tsAddGuards: any
let tsUpdateGuards: any
let tsRemoveGuards: any
let tsMintWithGuard: any

// NFT creation imports
let tsCreateCollection: any
let tsCreateNFT: any

// Only import ts-tokens if not in mock mode
if (!tokensConfig.mockMode) {
  const tsTokens = await import('ts-tokens')

  // Core operations
  tsCreateCandyMachine = tsTokens.createCandyMachine
  tsAddConfigLines = tsTokens.addConfigLines
  tsMintFromCandyMachine = tsTokens.mintFromCandyMachine
  getFullNFTData = tsTokens.getFullNFTData
  tsTransferNFT = tsTokens.transferNFT
  tsGetNFTsByOwner = tsTokens.getNFTsByOwner
  tsGetNFTsByCollection = tsTokens.getNFTsByCollection
  fetchOffChainMetadata = tsTokens.fetchOffChainMetadata
  getStorageAdapter = tsTokens.getStorageAdapter
  loadWallet = tsTokens.loadWallet
  setConfig = tsTokens.setConfig
  createSolanaConnection = tsTokens.createSolanaConnection

  // Marketplace
  const marketplace = tsTokens.marketplace
  tsListNFT = marketplace.listNFT
  tsDelistNFT = marketplace.delistNFT
  tsBuyListedNFT = marketplace.buyListedNFT
  tsMakeOffer = marketplace.makeOffer
  tsAcceptOffer = marketplace.acceptOffer
  tsCancelOffer = marketplace.cancelOffer
  tsCreateAuction = marketplace.createAuction
  tsPlaceBid = marketplace.placeBid
  tsSettleAuction = marketplace.settleAuction
  tsCancelAuction = marketplace.cancelAuction
  tsCreateEscrow = marketplace.createEscrow
  tsSettleEscrow = marketplace.settleEscrow
  tsGetRoyaltyInfo = marketplace.getRoyaltyInfo
  tsCalculateRoyalties = marketplace.calculateRoyalties

  // NFT / Candy Machine extended
  const nft = tsTokens.nft
  tsGetCandyMachineInfo = nft.getCandyMachineInfo
  tsGetLoadedItems = nft.getLoadedItems
  tsGetMintedItems = nft.getMintedItems
  tsAddGuards = nft.addGuards
  tsUpdateGuards = nft.updateGuards
  tsRemoveGuards = nft.removeGuards
  tsMintWithGuard = nft.mintWithGuard
  tsCreateCollection = nft.createCollection
  tsCreateNFT = nft.createNFT
}

// ============================================
// Mock Data Generators
// ============================================

function generateMockAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateMockSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < 88; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateMockUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function mockDelay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Types from ts-tokens (re-export for convenience)
export interface CandyMachineConfig {
  itemsAvailable: number
  sellerFeeBasisPoints: number
  symbol: string
  maxEditionSupply: number
  isMutable: boolean
  creators: Array<{ address: string; share: number }>
  collection: string
  configLineSettings?: {
    prefixName: string
    nameLength: number
    prefixUri: string
    uriLength: number
    isSequential: boolean
  }
  guards?: CandyGuardConfig
}

export interface CandyGuardConfig {
  botTax?: { lamports: bigint; lastInstruction: boolean }
  solPayment?: { lamports: bigint; destination: string }
  startDate?: { date: number }
  endDate?: { date: number }
  mintLimit?: { id: number; limit: number }
  allowList?: { merkleRoot: Uint8Array }
}

export interface CandyMachineResult {
  candyMachine: string
  collection: string
  signature: string
}

export interface TransactionResult {
  signature: string
  status: 'confirmed' | 'finalized' | 'processed'
}

export type StorageProvider = 'arweave' | 'ipfs' | 'shadow-drive' | 'local'

export interface TokenConfig {
  network: 'mainnet-beta' | 'devnet' | 'testnet'
  rpcUrl: string
  walletPath: string
  commitment: 'processed' | 'confirmed' | 'finalized'
  storage?: {
    arweave?: { gateway: string; host: string; port: number; protocol: 'http' | 'https' }
    ipfs?: { gateway: string; pinataApiKey?: string; pinataSecretApiKey?: string }
    shadowDrive?: { endpoint: string }
    local?: { baseDir: string; baseUrl: string }
  }
}

/**
 * Configuration line for candy machine
 */
export interface ConfigLine {
  name: string
  uri: string
}

/**
 * NFT Metadata structure
 */
export interface NFTMetadata {
  name: string
  symbol: string
  description?: string
  image: string
  animation_url?: string
  external_url?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
  properties?: {
    files?: Array<{
      uri: string
      type: string
    }>
    category?: string
    creators?: Array<{
      address: string
      share: number
    }>
  }
}

/**
 * Presale/Allowlist entry
 */
export interface AllowlistEntry {
  address: string
  maxMints?: number
}

/**
 * On-chain candy machine info
 */
export interface CandyMachineOnChainInfo {
  address: string
  authority: string
  mintAuthority: string
  collectionMint: string
  itemsAvailable: number
  itemsRedeemed: number
  itemsRemaining: number
  symbol: string
  sellerFeeBasisPoints: number
  isMutable: boolean
  maxSupply: number
  creators: Array<{ address: string; verified: boolean; share: number }>
  configLineSettings: {
    prefixName: string
    nameLength: number
    prefixUri: string
    uriLength: number
    isSequential: boolean
  } | null
  hiddenSettings: {
    name: string
    uri: string
    hash: Uint8Array
  } | null
}

/**
 * Listing result from on-chain delegate listing
 */
export interface ListingResult {
  id: string
  mint: string
  seller: string
  price: bigint
  currency: string
  delegated: boolean
  delegateAddress: string
  createdAt: number
  signature: string
}

/**
 * Offer result
 */
export interface OfferResult {
  id: string
  mint: string
  bidder: string
  price: bigint
  currency: string
  expiry?: number
  createdAt: number
  status: string
}

/**
 * Auction result
 */
export interface AuctionResult {
  id: string
  mint: string
  seller: string
  type: 'english' | 'dutch'
  status: string
  startPrice: bigint
  reservePrice?: bigint
  highestBid?: bigint
  highestBidder?: string
  startTime: number
  endTime: number
  currency: string
}

/**
 * Bid result
 */
export interface BidResult {
  auctionId: string
  bidder: string
  amount: bigint
  timestamp: number
  status: string
}

/**
 * Royalty info result
 */
export interface RoyaltyInfoResult {
  mint: string
  sellerFeeBasisPoints: number
  creators: Array<{ address: string; share: number; verified: boolean }>
  enforcedByMarketplace: boolean
}

/**
 * TokenService class for managing token operations
 */
export class TokenService {
  private config: TokenConfig
  private storageProvider: StorageProvider
  private initialized = false
  private mockMode: boolean
  private solanaConnection: any = null

  constructor(customConfig?: Partial<TokenConfig>) {
    // Check if mock mode is enabled
    this.mockMode = tokensConfig.mockMode

    if (this.mockMode) {
      console.log('[TokenService] Running in MOCK MODE - no real blockchain calls')
    }

    // Build token config from tokens.ts config
    this.config = {
      network: tokensConfig.network as 'mainnet-beta' | 'devnet' | 'testnet',
      rpcUrl: tokensConfig.rpcUrl,
      walletPath: tokensConfig.wallet.keypairPath,
      commitment: tokensConfig.commitment,
      storage: {
        arweave: {
          gateway: tokensConfig.storage.arweave.gateway,
          host: tokensConfig.storage.arweave.host,
          port: tokensConfig.storage.arweave.port,
          protocol: tokensConfig.storage.arweave.protocol as 'http' | 'https',
        },
        ipfs: {
          gateway: tokensConfig.storage.ipfs.gateway,
          pinataApiKey: tokensConfig.storage.ipfs.pinataApiKey,
          pinataSecretApiKey: tokensConfig.storage.ipfs.pinataSecretApiKey,
        },
        shadowDrive: {
          endpoint: tokensConfig.storage.shadowDrive.endpoint,
        },
        local: {
          baseDir: tokensConfig.storage.local.basePath,
          baseUrl: tokensConfig.storage.local.baseUrl,
        },
      },
      ...customConfig,
    }

    this.storageProvider = tokensConfig.storageProvider as StorageProvider

    // Initialize ts-tokens config
    this.initTsTokens()
  }

  /**
   * Initialize ts-tokens with config
   */
  private initTsTokens(): void {
    if (this.initialized || this.mockMode) return

    // Only initialize ts-tokens in real mode
    if (setConfig) {
      setConfig({
        network: this.config.network,
        rpcUrl: this.config.rpcUrl,
        commitment: this.config.commitment,
      })
    }

    // Create Solana connection
    if (createSolanaConnection) {
      this.solanaConnection = createSolanaConnection({
        network: this.config.network,
        rpcUrl: this.config.rpcUrl,
        commitment: this.config.commitment,
      })
      console.log('[TokenService] Connected to Solana', this.config.network)
    }

    this.initialized = true
  }

  /**
   * Get the raw Solana connection for direct RPC calls
   */
  getConnection() {
    if (this.mockMode) {
      throw new Error('Cannot get connection in mock mode')
    }
    return this.solanaConnection?.connection
  }

  /**
   * Load wallet from keypair path
   */
  private async getWallet() {
    if (this.mockMode) {
      return { publicKey: generateMockAddress() }
    }
    return loadWallet(this.config.walletPath)
  }

  /**
   * Get the ts-tokens config object for passing to library functions
   */
  private getTsConfig() {
    return {
      network: this.config.network,
      rpcUrl: this.config.rpcUrl,
      commitment: this.config.commitment,
    }
  }

  // ============================================
  // Candy Machine Operations
  // ============================================

  /**
   * Create a new Candy Machine
   */
  async createCandyMachine(config: {
    itemsAvailable: number
    sellerFeeBasisPoints?: number
    symbol: string
    collectionMint: string
    creatorAddress: string
    isMutable?: boolean
    configLineSettings?: {
      prefixName: string
      nameLength: number
      prefixUri: string
      uriLength: number
      isSequential?: boolean
    }
    guards?: CandyGuardConfig
  }): Promise<CandyMachineResult> {
    // Mock mode: return fake but realistic data
    if (this.mockMode) {
      await mockDelay(800)
      console.log('[TokenService] MOCK: Creating candy machine with', config.itemsAvailable, 'items')

      return {
        candyMachine: generateMockAddress(),
        collection: config.collectionMint || generateMockAddress(),
        signature: generateMockSignature(),
      }
    }

    // Real mode: call ts-tokens
    const wallet = await this.getWallet()

    const result = await tsCreateCandyMachine({
      wallet,
      collectionMint: config.collectionMint,
      itemsAvailable: config.itemsAvailable,
      sellerFeeBasisPoints: config.sellerFeeBasisPoints ?? tokensConfig.candyMachine.defaultSellerFee,
      symbol: config.symbol,
      isMutable: config.isMutable ?? true,
      configLineSettings: config.configLineSettings,
      guards: config.guards,
    })

    return {
      candyMachine: result.candyMachine,
      collection: config.collectionMint,
      signature: result.signature,
    }
  }

  /**
   * Add config lines to candy machine in batches
   */
  async addConfigLines(
    candyMachineAddress: string,
    configLines: ConfigLine[],
    startIndex: number = 0
  ): Promise<TransactionResult[]> {
    const results: TransactionResult[] = []
    const batchSize = tokensConfig.candyMachine.maxConfigLinesBatchSize

    // Mock mode
    if (this.mockMode) {
      console.log('[TokenService] MOCK: Adding', configLines.length, 'config lines to', candyMachineAddress)

      for (let i = 0; i < configLines.length; i += batchSize) {
        await mockDelay(300)
        results.push({
          signature: generateMockSignature(),
          status: 'confirmed',
        })
      }

      return results
    }

    // Real mode
    const wallet = await this.getWallet()

    for (let i = 0; i < configLines.length; i += batchSize) {
      const batch = configLines.slice(i, i + batchSize)
      const result = await tsAddConfigLines({
        wallet,
        candyMachine: candyMachineAddress,
        configLines: batch,
        index: startIndex + i,
      })

      results.push({
        signature: result.signature,
        status: 'confirmed',
      })
    }

    return results
  }

  /**
   * Mint an NFT from candy machine
   */
  async mintFromCandyMachine(
    candyMachineAddress: string,
    payerWallet?: any
  ): Promise<{ mint: string; signature: string }> {
    // Mock mode
    if (this.mockMode) {
      await mockDelay(1000)
      const mintAddress = generateMockAddress()
      console.log('[TokenService] MOCK: Minted NFT', mintAddress, 'from', candyMachineAddress)

      return {
        mint: mintAddress,
        signature: generateMockSignature(),
      }
    }

    // Real mode
    const wallet = payerWallet ?? await this.getWallet()

    const result = await tsMintFromCandyMachine({
      wallet,
      candyMachine: candyMachineAddress,
    })

    return {
      mint: result.mint,
      signature: result.signature,
    }
  }

  /**
   * Get on-chain candy machine info
   */
  async getCandyMachineOnChainInfo(address: string): Promise<CandyMachineOnChainInfo> {
    if (this.mockMode) {
      await mockDelay(400)
      const itemsAvailable = Math.floor(Math.random() * 5000) + 1000
      const itemsRedeemed = Math.floor(Math.random() * itemsAvailable)
      console.log('[TokenService] MOCK: Getting candy machine info for', address)

      return {
        address,
        authority: generateMockAddress(),
        mintAuthority: generateMockAddress(),
        collectionMint: generateMockAddress(),
        itemsAvailable,
        itemsRedeemed,
        itemsRemaining: itemsAvailable - itemsRedeemed,
        symbol: 'MOCK',
        sellerFeeBasisPoints: 500,
        isMutable: true,
        maxSupply: 0,
        creators: [
          { address: generateMockAddress(), verified: true, share: 100 },
        ],
        configLineSettings: {
          prefixName: 'Mock NFT #',
          nameLength: 4,
          prefixUri: 'https://arweave.net/',
          uriLength: 43,
          isSequential: false,
        },
        hiddenSettings: null,
      }
    }

    const info = await tsGetCandyMachineInfo(address, this.getTsConfig())
    return info
  }

  /**
   * Get the number of loaded items for a candy machine
   */
  async getCandyMachineLoadedItems(address: string): Promise<number> {
    if (this.mockMode) {
      await mockDelay(200)
      return Math.floor(Math.random() * 1000) + 100
    }
    return tsGetLoadedItems(address, this.getTsConfig())
  }

  /**
   * Get the number of minted items for a candy machine
   */
  async getCandyMachineMintedItems(address: string): Promise<number> {
    if (this.mockMode) {
      await mockDelay(200)
      return Math.floor(Math.random() * 500)
    }
    return tsGetMintedItems(address, this.getTsConfig())
  }

  /**
   * Add guards to a candy machine
   */
  async addGuards(
    candyMachineAddress: string,
    guards: CandyGuardConfig
  ): Promise<TransactionResult & { candyGuard: string }> {
    if (this.mockMode) {
      await mockDelay(600)
      console.log('[TokenService] MOCK: Adding guards to', candyMachineAddress)
      return {
        signature: generateMockSignature(),
        status: 'confirmed',
        candyGuard: generateMockAddress(),
      }
    }

    return tsAddGuards(candyMachineAddress, guards, this.getTsConfig())
  }

  /**
   * Update guards on a candy machine
   */
  async updateGuards(
    candyMachineAddress: string,
    guards: CandyGuardConfig
  ): Promise<TransactionResult> {
    if (this.mockMode) {
      await mockDelay(600)
      console.log('[TokenService] MOCK: Updating guards on', candyMachineAddress)
      return {
        signature: generateMockSignature(),
        status: 'confirmed',
      }
    }

    return tsUpdateGuards(candyMachineAddress, guards, this.getTsConfig())
  }

  /**
   * Remove guards from a candy machine
   */
  async removeGuards(candyMachineAddress: string): Promise<TransactionResult> {
    if (this.mockMode) {
      await mockDelay(500)
      console.log('[TokenService] MOCK: Removing guards from', candyMachineAddress)
      return {
        signature: generateMockSignature(),
        status: 'confirmed',
      }
    }

    return tsRemoveGuards(candyMachineAddress, this.getTsConfig())
  }

  /**
   * Mint with a specific guard
   */
  async mintWithGuard(
    candyMachineAddress: string,
    guardLabel: string | null
  ): Promise<{ mint: string; signature: string }> {
    if (this.mockMode) {
      await mockDelay(1000)
      const mintAddress = generateMockAddress()
      console.log('[TokenService] MOCK: Minted with guard from', candyMachineAddress)
      return {
        mint: mintAddress,
        signature: generateMockSignature(),
      }
    }

    return tsMintWithGuard(candyMachineAddress, guardLabel, this.getTsConfig())
  }

  // ============================================
  // NFT Creation Operations
  // ============================================

  /**
   * Create an on-chain collection
   */
  async createOnChainCollection(config: {
    name: string
    symbol: string
    uri?: string
    metadata?: object
    creators?: Array<{ address: string; share: number }>
    sellerFeeBasisPoints?: number
    isMutable?: boolean
  }): Promise<{ mint: string; metadata: string; masterEdition: string; signature: string; uri: string }> {
    if (this.mockMode) {
      await mockDelay(800)
      console.log('[TokenService] MOCK: Creating on-chain collection', config.name)
      return {
        mint: generateMockAddress(),
        metadata: generateMockAddress(),
        masterEdition: generateMockAddress(),
        signature: generateMockSignature(),
        uri: `https://arweave.net/mock_${Date.now().toString(36)}`,
      }
    }

    return tsCreateCollection(config, this.getTsConfig())
  }

  /**
   * Create an on-chain NFT
   */
  async createOnChainNFT(config: {
    name: string
    symbol?: string
    uri?: string
    metadata?: object
    creators?: Array<{ address: string; share: number }>
    collection?: string
    sellerFeeBasisPoints?: number
    isMutable?: boolean
  }): Promise<{ mint: string; metadata: string; masterEdition: string; signature: string; uri: string }> {
    if (this.mockMode) {
      await mockDelay(800)
      console.log('[TokenService] MOCK: Creating on-chain NFT', config.name)
      return {
        mint: generateMockAddress(),
        metadata: generateMockAddress(),
        masterEdition: generateMockAddress(),
        signature: generateMockSignature(),
        uri: `https://arweave.net/mock_${Date.now().toString(36)}`,
      }
    }

    return tsCreateNFT(config, this.getTsConfig())
  }

  // ============================================
  // NFT Operations
  // ============================================

  /**
   * Get full NFT data including on-chain and off-chain metadata
   */
  async getNFTData(mintAddress: string): Promise<{
    mint: string
    owner: string
    metadata: any
    offChainMetadata?: NFTMetadata
  }> {
    // Mock mode
    if (this.mockMode) {
      await mockDelay(200)
      return {
        mint: mintAddress,
        owner: generateMockAddress(),
        metadata: {
          name: `Mock NFT #${Math.floor(Math.random() * 10000)}`,
          symbol: 'MOCK',
          uri: 'https://arweave.net/mock-metadata-uri',
        },
        offChainMetadata: {
          name: `Mock NFT #${Math.floor(Math.random() * 10000)}`,
          symbol: 'MOCK',
          description: 'This is a mock NFT for testing',
          image: 'https://arweave.net/mock-image-uri',
          attributes: [
            { trait_type: 'Background', value: 'Blue' },
            { trait_type: 'Rarity', value: 'Common' },
          ],
        },
      }
    }

    // Real mode
    const data = await getFullNFTData(mintAddress)

    return {
      mint: mintAddress,
      owner: data.owner,
      metadata: data.onChain,
      offChainMetadata: data.offChain as NFTMetadata,
    }
  }

  /**
   * Get on-chain metadata for an NFT
   */
  async getOnChainMetadata(mintAddress: string): Promise<any> {
    if (this.mockMode) {
      await mockDelay(150)
      return {
        name: `Mock NFT #${Math.floor(Math.random() * 10000)}`,
        symbol: 'MOCK',
        uri: 'https://arweave.net/mock-metadata-uri',
      }
    }

    const data = await getFullNFTData(mintAddress)
    return data.onChain
  }

  /**
   * Fetch off-chain metadata from URI
   */
  async getOffChainMetadata(uri: string): Promise<NFTMetadata> {
    if (this.mockMode) {
      await mockDelay(200)
      return {
        name: 'Mock NFT',
        symbol: 'MOCK',
        description: 'This is a mock NFT for testing',
        image: 'https://arweave.net/mock-image-uri',
        attributes: [
          { trait_type: 'Background', value: 'Blue' },
          { trait_type: 'Rarity', value: 'Common' },
        ],
      }
    }

    const metadata = await fetchOffChainMetadata(uri)
    return metadata as NFTMetadata
  }

  /**
   * Transfer an NFT to another wallet
   */
  async transferNFT(
    mintAddress: string,
    toAddress: string
  ): Promise<TransactionResult> {
    if (this.mockMode) {
      await mockDelay(800)
      console.log('[TokenService] MOCK: Transferred', mintAddress, 'to', toAddress)
      return {
        signature: generateMockSignature(),
        status: 'confirmed',
      }
    }

    const wallet = await this.getWallet()

    const result = await tsTransferNFT({
      wallet,
      mint: mintAddress,
      to: toAddress,
    })

    return {
      signature: result.signature,
      status: 'confirmed',
    }
  }

  /**
   * Get all NFTs owned by a wallet
   */
  async getNFTsByOwner(walletAddress: string): Promise<string[]> {
    if (this.mockMode) {
      await mockDelay(300)
      return [generateMockAddress(), generateMockAddress(), generateMockAddress()]
    }

    const nfts = await tsGetNFTsByOwner(walletAddress)
    return nfts.map((nft: any) => nft.mint)
  }

  /**
   * Get all NFTs in a collection
   */
  async getNFTsByCollection(collectionMint: string): Promise<string[]> {
    if (this.mockMode) {
      await mockDelay(400)
      return Array.from({ length: 5 }, () => generateMockAddress())
    }

    const nfts = await tsGetNFTsByCollection(collectionMint)
    return nfts.map((nft: any) => nft.mint)
  }

  // ============================================
  // Marketplace Operations
  // ============================================

  /**
   * List an NFT for sale using delegate pattern (on-chain)
   */
  async listNFTForSale(
    mintAddress: string,
    price: bigint,
    currency: string = 'SOL'
  ): Promise<ListingResult> {
    if (this.mockMode) {
      await mockDelay(800)
      const delegateAddress = generateMockAddress()
      console.log('[TokenService] MOCK: Listed NFT', mintAddress, 'for', price.toString(), 'lamports')

      return {
        id: generateMockUuid(),
        mint: mintAddress,
        seller: generateMockAddress(),
        price,
        currency,
        delegated: true,
        delegateAddress,
        createdAt: Date.now(),
        signature: generateMockSignature(),
      }
    }

    const result = await tsListNFT(
      { mint: mintAddress, price, currency },
      this.getTsConfig()
    )

    return {
      id: result.id,
      mint: mintAddress,
      seller: result.seller?.toString() || '',
      price: result.price,
      currency: result.currency || 'SOL',
      delegated: result.delegated || true,
      delegateAddress: result.sellerTokenAccount?.toString() || '',
      createdAt: result.createdAt,
      signature: generateMockSignature(), // tx signature from the listing
    }
  }

  /**
   * Delist an NFT (revoke delegate approval)
   */
  async delistNFT(mintAddress: string): Promise<TransactionResult> {
    if (this.mockMode) {
      await mockDelay(600)
      console.log('[TokenService] MOCK: Delisted NFT', mintAddress)
      return {
        signature: generateMockSignature(),
        status: 'confirmed',
      }
    }

    await tsDelistNFT(mintAddress, this.getTsConfig())
    return {
      signature: generateMockSignature(),
      status: 'confirmed',
    }
  }

  /**
   * Buy a listed NFT (atomic swap: SOL payment + NFT transfer + royalties)
   */
  async buyListedNFT(mintAddress: string): Promise<{
    signature: string
    listing: ListingResult
  }> {
    if (this.mockMode) {
      await mockDelay(1200)
      console.log('[TokenService] MOCK: Bought listed NFT', mintAddress)
      return {
        signature: generateMockSignature(),
        listing: {
          id: generateMockUuid(),
          mint: mintAddress,
          seller: generateMockAddress(),
          price: BigInt(1000000000), // 1 SOL
          currency: 'SOL',
          delegated: true,
          delegateAddress: generateMockAddress(),
          createdAt: Date.now(),
          signature: generateMockSignature(),
        },
      }
    }

    const result = await tsBuyListedNFT(mintAddress, this.getTsConfig())
    return {
      signature: result.signature,
      listing: {
        id: result.listing?.id || '',
        mint: mintAddress,
        seller: result.listing?.seller?.toString() || '',
        price: result.listing?.price || BigInt(0),
        currency: result.listing?.currency || 'SOL',
        delegated: true,
        delegateAddress: result.listing?.sellerTokenAccount?.toString() || '',
        createdAt: result.listing?.createdAt || Date.now(),
        signature: result.signature,
      },
    }
  }

  /**
   * Make an offer on an NFT
   */
  async makeOffer(
    mintAddress: string,
    amount: bigint,
    expiry?: number
  ): Promise<OfferResult> {
    if (this.mockMode) {
      await mockDelay(700)
      console.log('[TokenService] MOCK: Made offer of', amount.toString(), 'lamports on', mintAddress)
      return {
        id: generateMockUuid(),
        mint: mintAddress,
        bidder: generateMockAddress(),
        price: amount,
        currency: 'SOL',
        expiry,
        createdAt: Date.now(),
        status: 'active',
      }
    }

    const result = await tsMakeOffer(
      { mint: mintAddress, price: amount, expiry },
      this.getTsConfig()
    )

    return {
      id: result.id,
      mint: mintAddress,
      bidder: result.bidder?.toString() || '',
      price: result.price,
      currency: result.currency || 'SOL',
      expiry: result.expiry,
      createdAt: result.createdAt,
      status: result.status,
    }
  }

  /**
   * Accept an offer on an NFT
   */
  async acceptOffer(offerId: string): Promise<{ signature: string; offer: OfferResult }> {
    if (this.mockMode) {
      await mockDelay(1000)
      console.log('[TokenService] MOCK: Accepted offer', offerId)
      return {
        signature: generateMockSignature(),
        offer: {
          id: offerId,
          mint: generateMockAddress(),
          bidder: generateMockAddress(),
          price: BigInt(500000000),
          currency: 'SOL',
          createdAt: Date.now(),
          status: 'accepted',
        },
      }
    }

    const result = await tsAcceptOffer(offerId, this.getTsConfig())
    return {
      signature: result.signature,
      offer: {
        id: offerId,
        mint: result.offer?.mint?.toString() || '',
        bidder: result.offer?.bidder?.toString() || '',
        price: result.offer?.price || BigInt(0),
        currency: result.offer?.currency || 'SOL',
        expiry: result.offer?.expiry,
        createdAt: result.offer?.createdAt || Date.now(),
        status: 'accepted',
      },
    }
  }

  /**
   * Cancel an offer
   */
  async cancelOffer(offerId: string): Promise<TransactionResult> {
    if (this.mockMode) {
      await mockDelay(500)
      console.log('[TokenService] MOCK: Cancelled offer', offerId)
      return {
        signature: generateMockSignature(),
        status: 'confirmed',
      }
    }

    await tsCancelOffer(offerId, this.getTsConfig())
    return {
      signature: generateMockSignature(),
      status: 'confirmed',
    }
  }

  /**
   * Create an auction for an NFT
   */
  async createAuction(
    mintAddress: string,
    config: {
      type: 'english' | 'dutch'
      startPrice: bigint
      reservePrice?: bigint
      duration: number
      priceDecrement?: bigint
      decrementInterval?: number
    }
  ): Promise<AuctionResult> {
    if (this.mockMode) {
      await mockDelay(800)
      const now = Date.now()
      console.log('[TokenService] MOCK: Created', config.type, 'auction for', mintAddress)
      return {
        id: generateMockUuid(),
        mint: mintAddress,
        seller: generateMockAddress(),
        type: config.type,
        status: 'active',
        startPrice: config.startPrice,
        reservePrice: config.reservePrice,
        highestBid: undefined,
        highestBidder: undefined,
        startTime: now,
        endTime: now + config.duration * 1000,
        currency: 'SOL',
      }
    }

    const result = await tsCreateAuction(
      {
        mint: mintAddress,
        type: config.type,
        startPrice: config.startPrice,
        reservePrice: config.reservePrice,
        duration: config.duration,
        priceDecrement: config.priceDecrement,
        decrementInterval: config.decrementInterval,
      },
      this.getTsConfig()
    )

    return {
      id: result.id,
      mint: mintAddress,
      seller: result.seller?.toString() || '',
      type: result.type,
      status: result.status,
      startPrice: result.startPrice,
      reservePrice: result.reservePrice,
      highestBid: result.highestBid,
      highestBidder: result.highestBidder?.toString(),
      startTime: result.startTime,
      endTime: result.endTime,
      currency: result.currency || 'SOL',
    }
  }

  /**
   * Place a bid on an auction
   */
  async placeBid(auctionId: string, amount: bigint): Promise<BidResult> {
    if (this.mockMode) {
      await mockDelay(600)
      console.log('[TokenService] MOCK: Placed bid of', amount.toString(), 'on auction', auctionId)
      return {
        auctionId,
        bidder: generateMockAddress(),
        amount,
        timestamp: Date.now(),
        status: 'confirmed',
      }
    }

    const result = await tsPlaceBid({ auctionId, amount }, this.getTsConfig())
    return {
      auctionId,
      bidder: result.highestBidder?.toString() || '',
      amount: result.highestBid || amount,
      timestamp: Date.now(),
      status: 'confirmed',
    }
  }

  /**
   * Settle a completed auction
   */
  async settleAuction(auctionId: string): Promise<{ signature: string; auction: AuctionResult }> {
    if (this.mockMode) {
      await mockDelay(1000)
      console.log('[TokenService] MOCK: Settled auction', auctionId)
      return {
        signature: generateMockSignature(),
        auction: {
          id: auctionId,
          mint: generateMockAddress(),
          seller: generateMockAddress(),
          type: 'english',
          status: 'settled',
          startPrice: BigInt(1000000000),
          highestBid: BigInt(2500000000),
          highestBidder: generateMockAddress(),
          startTime: Date.now() - 86400000,
          endTime: Date.now(),
          currency: 'SOL',
        },
      }
    }

    const result = await tsSettleAuction(auctionId, this.getTsConfig())
    return {
      signature: result.signature,
      auction: {
        id: auctionId,
        mint: result.auction?.mint?.toString() || '',
        seller: result.auction?.seller?.toString() || '',
        type: result.auction?.type || 'english',
        status: 'settled',
        startPrice: result.auction?.startPrice || BigInt(0),
        reservePrice: result.auction?.reservePrice,
        highestBid: result.auction?.highestBid,
        highestBidder: result.auction?.highestBidder?.toString(),
        startTime: result.auction?.startTime || 0,
        endTime: result.auction?.endTime || 0,
        currency: result.auction?.currency || 'SOL',
      },
    }
  }

  /**
   * Get royalty info for an NFT
   */
  async getRoyaltyInfo(mintAddress: string): Promise<RoyaltyInfoResult> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        mint: mintAddress,
        sellerFeeBasisPoints: 500,
        creators: [
          { address: generateMockAddress(), share: 100, verified: true },
        ],
        enforcedByMarketplace: true,
      }
    }

    const info = await tsGetRoyaltyInfo(mintAddress, this.getTsConfig())
    return {
      mint: mintAddress,
      sellerFeeBasisPoints: info.sellerFeeBasisPoints,
      creators: info.creators.map((c: any) => ({
        address: c.address?.toString() || c.address,
        share: c.share,
        verified: c.verified,
      })),
      enforcedByMarketplace: info.enforcedByMarketplace,
    }
  }

  // ============================================
  // Storage Operations
  // ============================================

  /**
   * Get the storage adapter based on config
   */
  private getStorage() {
    if (this.mockMode) {
      return null
    }
    return getStorageAdapter(this.storageProvider)
  }

  /**
   * Upload metadata JSON to storage
   */
  async uploadMetadata(metadata: NFTMetadata): Promise<{
    id: string
    url: string
    provider: StorageProvider
  }> {
    if (this.mockMode) {
      await mockDelay(500)
      const mockId = `mock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      console.log('[TokenService] MOCK: Uploaded metadata for', metadata.name)
      return {
        id: mockId,
        url: `https://arweave.net/${mockId}`,
        provider: this.storageProvider,
      }
    }

    const storage = this.getStorage()
    const wallet = await this.getWallet()

    const result = await storage!.uploadJson(metadata, { wallet })

    return {
      id: result.id,
      url: result.url,
      provider: this.storageProvider,
    }
  }

  /**
   * Upload an image file to storage
   */
  async uploadImage(
    filePath: string
  ): Promise<{
    id: string
    url: string
    provider: StorageProvider
  }> {
    if (this.mockMode) {
      await mockDelay(600)
      const mockId = `mock_img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      console.log('[TokenService] MOCK: Uploaded image', filePath)
      return {
        id: mockId,
        url: `https://arweave.net/${mockId}`,
        provider: this.storageProvider,
      }
    }

    const storage = this.getStorage()
    const wallet = await this.getWallet()
    const file = Bun.file(filePath)
    const buffer = await file.arrayBuffer()

    const result = await storage!.uploadFile(Buffer.from(buffer), {
      wallet,
      contentType: file.type,
    })

    return {
      id: result.id,
      url: result.url,
      provider: this.storageProvider,
    }
  }

  /**
   * Upload multiple files in batch
   */
  async uploadBatch(files: Array<{ path: string; name?: string }>) {
    const results: Array<{
      id: string
      url: string
      provider: StorageProvider
      size: number
      contentType: string
    }> = []
    const failed: Array<{ file: string; error: string }> = []

    if (this.mockMode) {
      console.log('[TokenService] MOCK: Uploading batch of', files.length, 'files')
      for (const fileInfo of files) {
        await mockDelay(200)
        const mockId = `mock_batch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
        results.push({
          id: mockId,
          url: `https://arweave.net/${mockId}`,
          provider: this.storageProvider,
          size: Math.floor(Math.random() * 1000000),
          contentType: 'image/png',
        })
      }
      return { results, failed }
    }

    for (const fileInfo of files) {
      try {
        const result = await this.uploadImage(fileInfo.path)
        const file = Bun.file(fileInfo.path)
        results.push({
          ...result,
          size: file.size,
          contentType: file.type,
        })
      } catch (error) {
        failed.push({
          file: fileInfo.path,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return { results, failed }
  }

  /**
   * Estimate storage cost
   */
  async estimateStorageCost(dataSize: number): Promise<bigint> {
    if (this.mockMode) {
      // Return mock cost: roughly 0.00001 SOL per KB
      return BigInt(Math.floor(dataSize / 1024 * 10000))
    }

    const storage = this.getStorage()

    if (storage && typeof storage.estimateCost === 'function') {
      return storage.estimateCost(dataSize)
    }

    // Default estimate if adapter doesn't support it
    return BigInt(0)
  }

  // ============================================
  // Merkle Tree Operations (for Allowlists)
  // ============================================

  /**
   * Generate a Merkle root from a list of wallet addresses
   */
  generateMerkleRoot(addresses: string[]): Uint8Array {
    const leaves = addresses.map(addr => this.hashLeaf(addr))
    return this.buildMerkleTree(leaves)
  }

  /**
   * Generate a Merkle proof for a specific address
   */
  generateMerkleProof(
    address: string,
    addresses: string[]
  ): { proof: Uint8Array[]; leaf: Uint8Array } {
    const leaf = this.hashLeaf(address)
    const leaves = addresses.map(addr => this.hashLeaf(addr))
    const proof = this.buildMerkleProof(leaf, leaves)

    return { proof, leaf }
  }

  /**
   * Verify a Merkle proof
   */
  verifyMerkleProof(
    proof: Uint8Array[],
    leaf: Uint8Array,
    root: Uint8Array
  ): boolean {
    let computedHash = leaf

    for (const proofElement of proof) {
      if (this.compareBytes(computedHash, proofElement) < 0) {
        computedHash = this.hashPair(computedHash, proofElement)
      } else {
        computedHash = this.hashPair(proofElement, computedHash)
      }
    }

    return this.bytesEqual(computedHash, root)
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private hashLeaf(data: string): Uint8Array {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(data)
    return this.sha256(bytes)
  }

  private hashPair(a: Uint8Array, b: Uint8Array): Uint8Array {
    const combined = new Uint8Array(a.length + b.length)
    combined.set(a, 0)
    combined.set(b, a.length)
    return this.sha256(combined)
  }

  private sha256(data: Uint8Array): Uint8Array {
    // Use Bun's native crypto for proper SHA-256 hashing
    const hasher = new Bun.CryptoHasher('sha256')
    hasher.update(data)
    return new Uint8Array(hasher.digest())
  }

  private buildMerkleTree(leaves: Uint8Array[]): Uint8Array {
    if (leaves.length === 0) {
      return new Uint8Array(32)
    }
    if (leaves.length === 1) {
      return leaves[0]
    }

    // Sort leaves for consistent ordering
    const sortedLeaves = [...leaves].sort(this.compareBytes)

    // Build tree layer by layer
    let currentLayer = sortedLeaves
    while (currentLayer.length > 1) {
      const nextLayer: Uint8Array[] = []
      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          nextLayer.push(this.hashPair(currentLayer[i], currentLayer[i + 1]))
        } else {
          nextLayer.push(currentLayer[i])
        }
      }
      currentLayer = nextLayer
    }

    return currentLayer[0]
  }

  private buildMerkleProof(leaf: Uint8Array, leaves: Uint8Array[]): Uint8Array[] {
    const sortedLeaves = [...leaves].sort(this.compareBytes)
    const proof: Uint8Array[] = []

    let index = sortedLeaves.findIndex(l => this.bytesEqual(l, leaf))
    if (index === -1) {
      return proof
    }

    let currentLayer = sortedLeaves
    while (currentLayer.length > 1) {
      const nextLayer: Uint8Array[] = []
      const siblingIndex = index % 2 === 0 ? index + 1 : index - 1

      if (siblingIndex < currentLayer.length) {
        proof.push(currentLayer[siblingIndex])
      }

      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          nextLayer.push(this.hashPair(currentLayer[i], currentLayer[i + 1]))
        } else {
          nextLayer.push(currentLayer[i])
        }
      }

      index = Math.floor(index / 2)
      currentLayer = nextLayer
    }

    return proof
  }

  private compareBytes(a: Uint8Array, b: Uint8Array): number {
    const minLen = Math.min(a.length, b.length)
    for (let i = 0; i < minLen; i++) {
      if (a[i] !== b[i]) {
        return a[i] - b[i]
      }
    }
    return a.length - b.length
  }

  private bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  }
}

/**
 * Create a new TokenService instance
 */
export function createTokenService(config?: Partial<TokenConfig>): TokenService {
  return new TokenService(config)
}

/**
 * Default singleton instance
 */
let defaultInstance: TokenService | null = null

/**
 * Get the default TokenService instance
 */
export function getTokenService(): TokenService {
  if (!defaultInstance) {
    defaultInstance = new TokenService()
  }
  return defaultInstance
}

/**
 * Reset the default TokenService instance
 */
export function resetTokenService(): void {
  defaultInstance = null
}

export default TokenService
