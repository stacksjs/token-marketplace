/**
 * TokenService - Wrapper for ts-tokens operations
 *
 * This service provides a unified interface for interacting with the ts-tokens library,
 * handling Candy Machine operations, NFT minting, storage, and metadata management.
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

// Only import ts-tokens if not in mock mode
if (!tokensConfig.mockMode) {
  const tsTokens = await import('ts-tokens')
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
      console.log('[TokenService] 🧪 Running in MOCK MODE - no real blockchain calls')
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
      console.log('[TokenService] ✅ Connected to Solana', this.config.network)
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
      await mockDelay(800) // Simulate network delay
      console.log('[TokenService] 🧪 MOCK: Creating candy machine with', config.itemsAvailable, 'items')

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
      console.log('[TokenService] 🧪 MOCK: Adding', configLines.length, 'config lines to', candyMachineAddress)

      for (let i = 0; i < configLines.length; i += batchSize) {
        await mockDelay(300) // Simulate batch processing
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
      await mockDelay(1000) // Simulate minting delay
      const mintAddress = generateMockAddress()
      console.log('[TokenService] 🧪 MOCK: Minted NFT', mintAddress, 'from', candyMachineAddress)

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
      console.log('[TokenService] 🧪 MOCK: Transferred', mintAddress, 'to', toAddress)
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
      // Return 3 mock NFTs
      return [generateMockAddress(), generateMockAddress(), generateMockAddress()]
    }

    const nfts = await tsGetNFTsByOwner(walletAddress)
    return nfts.map(nft => nft.mint)
  }

  /**
   * Get all NFTs in a collection
   */
  async getNFTsByCollection(collectionMint: string): Promise<string[]> {
    if (this.mockMode) {
      await mockDelay(400)
      // Return 5 mock NFTs for the collection
      return Array.from({ length: 5 }, () => generateMockAddress())
    }

    const nfts = await tsGetNFTsByCollection(collectionMint)
    return nfts.map(nft => nft.mint)
  }

  // ============================================
  // Storage Operations
  // ============================================

  /**
   * Get the storage adapter based on config
   */
  private getStorage() {
    if (this.mockMode) {
      return null // Not used in mock mode
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
      console.log('[TokenService] 🧪 MOCK: Uploaded metadata for', metadata.name)
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
      console.log('[TokenService] 🧪 MOCK: Uploaded image', filePath)
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
      console.log('[TokenService] 🧪 MOCK: Uploading batch of', files.length, 'files')
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
    // Simple Merkle tree implementation for allowlists
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
    // Simple XOR-based hash for development (not cryptographically secure)
    // TODO: Replace with proper crypto once ts-tokens is integrated
    const hash = new Uint8Array(32)
    for (let i = 0; i < data.length; i++) {
      hash[i % 32] ^= data[i]
    }
    return hash
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
