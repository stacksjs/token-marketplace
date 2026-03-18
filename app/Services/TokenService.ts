/**
 * TokenService - Thin mock-or-passthrough layer on top of ts-tokens
 *
 * In real mode, every method delegates directly to ts-tokens.
 * In mock mode (TOKENS_MOCK_MODE=true), methods return realistic fake data.
 */

import tokensConfig, { getTsTokensConfig } from '../../config/tokens'

// Re-export ts-tokens types that are available at the top level
export type {
  // Config
  TokenConfig, SolanaNetwork, Commitment, StorageProvider,
  // Transaction
  TransactionResult, TransactionStatus,
  // NFT & Candy Machine
  CandyMachineConfig, CandyMachineInfo,
  NFTInfo, CreateCollectionOptions,
} from 'ts-tokens'

// ============================================
// Single dynamic import for ts-tokens
// ============================================

let ts: any = null
let tsNft: any = null
const mockMode = tokensConfig.mockMode
const envVarsTS = typeof Bun !== 'undefined' ? Bun.env : process.env

if (mockMode && envVarsTS.NODE_ENV === 'production') {
  throw new Error('[TokenService] FATAL: TOKENS_MOCK_MODE is enabled in production. This is a security risk. Aborting.')
}

if (!mockMode) {
  ts = await import('ts-tokens')
  try {
    tsNft = await import('ts-tokens/nft')
  }
  catch {
    console.warn('[TokenService] ts-tokens/nft subpath not available — candy machine features disabled')
    tsNft = ts // fallback: use main export (has createNFT, updateNFTMetadata, etc.)
  }
  ts.setConfig(getTsTokensConfig() as any)
  console.log('[TokenService] Connected to Solana', tokensConfig.network)
}
else {
  console.log('[TokenService] Running in MOCK MODE - no real blockchain calls')
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

// ============================================
// App-specific types
// ============================================

/**
 * Unsigned transaction returned to client for wallet signing
 */
export interface UnsignedTransaction {
  serializedTransaction: string
  message: string
}

// ============================================
// TokenService Class
// ============================================

export class TokenService {
  private mockMode: boolean

  constructor() {
    this.mockMode = mockMode
  }

  // ============================================
  // Config
  // ============================================

  getConnection() {
    if (this.mockMode) {
      throw new Error('Cannot get connection in mock mode')
    }
    return ts!.createSolanaConnection({
      network: tokensConfig.network as any,
      rpcUrl: tokensConfig.rpcUrl,
      commitment: tokensConfig.commitment,
    })
  }

  // ============================================
  // Candy Machine Operations
  // ============================================

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
    guards?: any
  }) {
    if (this.mockMode) {
      await mockDelay(800)
      return {
        candyMachine: generateMockAddress(),
        collection: config.collectionMint || generateMockAddress(),
        signature: generateMockSignature(),
      }
    }

    const wallet = await ts!.loadWallet(tokensConfig.wallet.keypairPath)
    const result = await ts!.createCandyMachine({
      wallet,
      collectionMint: config.collectionMint,
      itemsAvailable: config.itemsAvailable,
      sellerFeeBasisPoints: config.sellerFeeBasisPoints ?? tokensConfig.candyMachine.defaultSellerFee,
      symbol: config.symbol,
      isMutable: config.isMutable ?? true,
      configLineSettings: config.configLineSettings,
      guards: config.guards,
    } as any)

    return {
      candyMachine: result.candyMachine,
      collection: config.collectionMint,
      signature: result.signature,
    }
  }

  async addConfigLines(
    candyMachineAddress: string,
    configLines: Array<{ name: string; uri: string }>,
    startIndex: number = 0,
  ) {
    const batchSize = tokensConfig.candyMachine.maxConfigLinesBatchSize
    const results: Array<{ signature: string; status: string }> = []

    if (this.mockMode) {
      for (let i = 0; i < configLines.length; i += batchSize) {
        await mockDelay(300)
        results.push({ signature: generateMockSignature(), status: 'confirmed' })
      }
      return results
    }

    const wallet = await ts!.loadWallet(tokensConfig.wallet.keypairPath)
    for (let i = 0; i < configLines.length; i += batchSize) {
      const batch = configLines.slice(i, i + batchSize)
      const result = await ts!.addConfigLines({
        wallet,
        candyMachine: candyMachineAddress,
        configLines: batch,
        index: startIndex + i,
      } as any)
      results.push({ signature: result.signature, status: 'confirmed' })
    }

    return results
  }

  async getCandyMachineInfo(address: string) {
    if (this.mockMode) {
      await mockDelay(400)
      const itemsAvailable = Math.floor(Math.random() * 5000) + 1000
      const itemsRedeemed = Math.floor(Math.random() * itemsAvailable)
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
        creators: [{ address: generateMockAddress(), verified: true, share: 100 }],
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

    return tsNft!.getCandyMachineInfo(address, getTsTokensConfig() as any)
  }

  async addGuards(candyMachineAddress: string, guards: any) {
    if (this.mockMode) {
      await mockDelay(600)
      return {
        signature: generateMockSignature(),
        status: 'confirmed' as const,
        candyGuard: generateMockAddress(),
      }
    }

    return tsNft!.addGuards(candyMachineAddress, guards, getTsTokensConfig() as any)
  }

  async updateGuards(candyMachineAddress: string, guards: any) {
    if (this.mockMode) {
      await mockDelay(600)
      return { signature: generateMockSignature(), status: 'confirmed' as const }
    }

    return tsNft!.updateGuards(candyMachineAddress, guards, getTsTokensConfig() as any)
  }

  async removeGuards(candyMachineAddress: string) {
    if (this.mockMode) {
      await mockDelay(500)
      return { signature: generateMockSignature(), status: 'confirmed' as const }
    }

    return tsNft!.removeGuards(candyMachineAddress, getTsTokensConfig() as any)
  }

  // ============================================
  // NFT Operations
  // ============================================

  async createCollection(config: {
    name: string
    symbol: string
    uri?: string
    metadata?: object
    creators?: Array<{ address: string; share: number }>
    sellerFeeBasisPoints?: number
    isMutable?: boolean
  }) {
    if (this.mockMode) {
      await mockDelay(800)
      return {
        mint: generateMockAddress(),
        metadata: generateMockAddress(),
        masterEdition: generateMockAddress(),
        signature: generateMockSignature(),
        uri: `https://arweave.net/mock_${Date.now().toString(36)}`,
      }
    }

    return ts!.createCollection(config as any, getTsTokensConfig() as any)
  }

  async createNFT(config: {
    name: string
    symbol?: string
    uri?: string
    metadata?: object
    creators?: Array<{ address: string; share: number }>
    collection?: string
    sellerFeeBasisPoints?: number
    isMutable?: boolean
  }) {
    if (this.mockMode) {
      await mockDelay(800)
      return {
        mint: generateMockAddress(),
        metadata: generateMockAddress(),
        masterEdition: generateMockAddress(),
        signature: generateMockSignature(),
        uri: `https://arweave.net/mock_${Date.now().toString(36)}`,
      }
    }

    return ts!.createNFT(config as any, getTsTokensConfig() as any)
  }

  async getNFTData(mintAddress: string) {
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

    const data = await ts!.getFullNFTData(mintAddress)
    return {
      mint: mintAddress,
      owner: data.owner,
      metadata: data.onChain,
      offChainMetadata: data.offChain,
    }
  }

  async getNFTsByOwner(walletAddress: string): Promise<string[]> {
    if (this.mockMode) {
      await mockDelay(300)
      return [generateMockAddress(), generateMockAddress(), generateMockAddress()]
    }

    const nfts = await ts!.getNFTsByOwner(walletAddress)
    return nfts.map((nft: any) => nft.mint)
  }

  async getNFTsByCollection(collectionMint: string): Promise<string[]> {
    if (this.mockMode) {
      await mockDelay(400)
      return Array.from({ length: 5 }, () => generateMockAddress())
    }

    const nfts = await ts!.getNFTsByCollection(collectionMint)
    return nfts.map((nft: any) => nft.mint)
  }

  async getNFTsByCreator(creatorAddress: string): Promise<string[]> {
    if (this.mockMode) {
      await mockDelay(400)
      return Array.from({ length: 8 }, () => generateMockAddress())
    }

    const nfts = await ts!.getNFTsByCreator(creatorAddress)
    return nfts.map((nft: any) => nft.mint)
  }

  async getCollectionInfo(collectionMint: string): Promise<{ metadata: any, size: number } | null> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        metadata: {
          mint: collectionMint,
          name: `Mock Collection #${Math.floor(Math.random() * 1000)}`,
          symbol: 'MOCK',
          uri: 'https://arweave.net/mock-collection-uri',
        },
        size: Math.floor(Math.random() * 100) + 10,
      }
    }

    return ts!.getCollectionInfo(collectionMint)
  }

  /**
   * Search for NFT collections using Helius DAS API.
   * Falls back to basic RPC search if Helius is not configured.
   */
  async searchCollections(options: {
    creatorWallet?: string
    limit?: number
  } = {}): Promise<Array<{
    mintAddress: string
    name: string
    symbol: string
    description: string
    imageUrl: string
    size: number
    creators: Array<{ address: string; verified: boolean; share: number }>
  }>> {
    if (this.mockMode) {
      await mockDelay(500)
      return Array.from({ length: 3 }, (_, i) => ({
        mintAddress: generateMockAddress(),
        name: `Mock Collection #${i + 1}`,
        symbol: 'MOCK',
        description: `A mock collection for development (#${i + 1})`,
        imageUrl: 'https://arweave.net/mock-image',
        size: Math.floor(Math.random() * 500) + 10,
        creators: [{ address: generateMockAddress(), verified: true, share: 100 }],
      }))
    }

    const heliusApiKey = tokensConfig.helius?.apiKey
    if (!heliusApiKey) {
      throw new Error('Helius API key is required for collection search. Set HELIUS_API_KEY in your environment.')
    }

    const { createHeliusClient } = await import('ts-tokens/indexer')
    const helius = createHeliusClient(heliusApiKey, tokensConfig.helius.cluster || 'devnet')
    const limit = options.limit || 50

    let assets: any[] = []

    if (options.creatorWallet) {
      // Search by creator
      const result = await helius.getAssetsByCreator(options.creatorWallet, {
        onlyVerified: true,
        limit,
      })
      assets = result.items || []
    } else {
      // General search for NFT collections
      const result = await helius.searchAssets({
        compressed: false,
        limit,
        sortBy: { sortBy: 'recent_action', sortDirection: 'desc' },
      })
      assets = result.items || []
    }

    // Group by collection and identify collection parents
    const collectionMints = new Set<string>()
    const collectionAssets = new Map<string, any>()

    for (const asset of assets) {
      // Check if this asset IS a collection (other assets reference it)
      // Collection NFTs typically have grouping entries
      const grouping = asset.grouping || []
      for (const g of grouping) {
        if (g.group_key === 'collection') {
          collectionMints.add(g.group_value)
        }
      }
    }

    // Fetch details for each discovered collection mint
    const collections: Array<{
      mintAddress: string
      name: string
      symbol: string
      description: string
      imageUrl: string
      size: number
      creators: Array<{ address: string; verified: boolean; share: number }>
    }> = []

    for (const mint of collectionMints) {
      try {
        const collectionAsset = await helius.getAsset(mint)
        const collectionNfts = await helius.getAssetsByGroup('collection', mint, { limit: 1 })

        collections.push({
          mintAddress: mint,
          name: collectionAsset.content?.metadata?.name || 'Unknown',
          symbol: collectionAsset.content?.metadata?.symbol || '',
          description: collectionAsset.content?.metadata?.description || '',
          imageUrl: collectionAsset.content?.links?.image || '',
          size: collectionNfts.total || 0,
          creators: collectionAsset.creators || [],
        })
      } catch {
        // Skip collections that fail to fetch
      }
    }

    return collections
  }

  /**
   * Fetch all NFTs in a collection using Helius DAS API (paginated, richer data).
   */
  async getCollectionNFTsViaHelius(collectionMint: string, options: {
    page?: number
    limit?: number
  } = {}): Promise<{
    items: Array<{
      mintAddress: string
      name: string
      description: string
      imageUrl: string
      owner: string
      attributes: Array<{ trait_type: string; value: string | number }>
    }>
    total: number
    page: number
  }> {
    if (this.mockMode) {
      await mockDelay(400)
      const items = Array.from({ length: 5 }, (_, i) => ({
        mintAddress: generateMockAddress(),
        name: `Mock NFT #${i + 1}`,
        description: 'A mock NFT',
        imageUrl: 'https://arweave.net/mock-nft',
        owner: generateMockAddress(),
        attributes: [{ trait_type: 'Background', value: 'Blue' }],
      }))
      return { items, total: 5, page: 1 }
    }

    const heliusApiKey = tokensConfig.helius?.apiKey
    if (!heliusApiKey) {
      throw new Error('Helius API key is required. Set HELIUS_API_KEY in your environment.')
    }

    const { createHeliusClient } = await import('ts-tokens/indexer')
    const helius = createHeliusClient(heliusApiKey, tokensConfig.helius.cluster || 'devnet')

    const result = await helius.getAssetsByGroup('collection', collectionMint, {
      page: options.page || 1,
      limit: options.limit || 50,
    })

    const items = (result.items || []).map((asset: any) => ({
      mintAddress: asset.id,
      name: asset.content?.metadata?.name || '',
      description: asset.content?.metadata?.description || '',
      imageUrl: asset.content?.links?.image || '',
      owner: asset.ownership?.owner || '',
      attributes: asset.content?.metadata?.attributes || [],
    }))

    return { items, total: result.total || 0, page: result.page || 1 }
  }

  async transferNFT(mintAddress: string, toAddress: string) {
    if (this.mockMode) {
      await mockDelay(800)
      return { signature: generateMockSignature(), confirmed: true }
    }

    const wallet = await ts!.loadWallet(tokensConfig.wallet.keypairPath)
    return ts!.transferNFT({ wallet, mint: mintAddress, to: toAddress } as any)
  }

  // ============================================
  // Marketplace Operations
  // ============================================

  async listNFT(mintAddress: string, price: bigint, currency: string = 'SOL') {
    if (this.mockMode) {
      await mockDelay(800)
      return {
        id: generateMockUuid(),
        mint: mintAddress,
        seller: generateMockAddress(),
        price,
        currency,
        delegated: true,
        delegateAddress: generateMockAddress(),
        createdAt: Date.now(),
        signature: generateMockSignature(),
      }
    }

    const result = await ts!.marketplace.listNFT(
      { mint: mintAddress, price, currency } as any,
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
      signature: generateMockSignature(),
    }
  }

  async delistNFT(mintAddress: string) {
    if (this.mockMode) {
      await mockDelay(600)
      return { signature: generateMockSignature(), confirmed: true }
    }

    await ts!.marketplace.delistNFT(mintAddress as any)
    return { signature: generateMockSignature(), confirmed: true }
  }

  async buyListedNFT(mintAddress: string) {
    if (this.mockMode) {
      await mockDelay(1200)
      return {
        signature: generateMockSignature(),
        listing: {
          id: generateMockUuid(),
          mint: mintAddress,
          seller: generateMockAddress(),
          price: BigInt(1000000000),
          currency: 'SOL',
          delegated: true,
          delegateAddress: generateMockAddress(),
          createdAt: Date.now(),
          signature: generateMockSignature(),
        },
      }
    }

    const result = await ts!.marketplace.buyListedNFT(mintAddress as any)
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

  async makeOffer(mintAddress: string, amount: bigint, expiry?: number) {
    if (this.mockMode) {
      await mockDelay(700)
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

    const result = await ts!.marketplace.makeOffer(
      { mint: mintAddress, price: amount, expiry } as any,
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

  async acceptOffer(offerId: string) {
    if (this.mockMode) {
      await mockDelay(1000)
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

    const result = await ts!.marketplace.acceptOffer(offerId as any)
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

  async cancelOffer(offerId: string) {
    if (this.mockMode) {
      await mockDelay(500)
      return { signature: generateMockSignature(), confirmed: true }
    }

    await ts!.marketplace.cancelOffer(offerId as any)
    return { signature: generateMockSignature(), confirmed: true }
  }

  async createAuction(
    mintAddress: string,
    config: {
      type: 'english' | 'dutch'
      startPrice: bigint
      reservePrice?: bigint
      duration: number
      priceDecrement?: bigint
      decrementInterval?: number
    },
  ) {
    if (this.mockMode) {
      await mockDelay(800)
      const now = Date.now()
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

    const result = await ts!.marketplace.createAuction({
      mint: mintAddress,
      type: config.type,
      startPrice: config.startPrice,
      reservePrice: config.reservePrice,
      duration: config.duration,
      priceDecrement: config.priceDecrement,
      decrementInterval: config.decrementInterval,
    } as any)

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

  async placeBid(auctionId: string, amount: bigint) {
    if (this.mockMode) {
      await mockDelay(600)
      return {
        auctionId,
        bidder: generateMockAddress(),
        amount,
        timestamp: Date.now(),
        status: 'confirmed',
      }
    }

    const result = await ts!.marketplace.placeBid({ auctionId, amount })
    return {
      auctionId,
      bidder: result.highestBidder?.toString() || '',
      amount: result.highestBid || amount,
      timestamp: Date.now(),
      status: 'confirmed',
    }
  }

  async settleAuction(auctionId: string) {
    if (this.mockMode) {
      await mockDelay(1000)
      return {
        signature: generateMockSignature(),
        auction: {
          id: auctionId,
          mint: generateMockAddress(),
          seller: generateMockAddress(),
          type: 'english' as const,
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

    const result = await ts!.marketplace.settleAuction(auctionId as any)
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

  async cancelAuction(auctionId: string) {
    if (this.mockMode) {
      await mockDelay(600)
      return { signature: generateMockSignature(), confirmed: true }
    }

    await ts!.marketplace.cancelAuction(auctionId as any)
    return { signature: generateMockSignature(), confirmed: true }
  }

  async createEscrow(mintAddress: string, price: bigint) {
    if (this.mockMode) {
      await mockDelay(800)
      return {
        id: generateMockUuid(),
        mint: mintAddress,
        seller: generateMockAddress(),
        price,
        currency: 'SOL',
        escrowAccount: generateMockAddress(),
        status: 'pending',
        createdAt: Date.now(),
        signature: generateMockSignature(),
      }
    }

    const result = await ts!.marketplace.createEscrow({ mint: mintAddress, price } as any)
    return {
      id: result.id,
      mint: mintAddress,
      seller: result.seller?.toString() || '',
      price: result.price,
      currency: result.currency || 'SOL',
      escrowAccount: result.escrowAccount?.toString() || '',
      status: result.status,
      createdAt: result.createdAt,
      signature: generateMockSignature(),
    }
  }

  async settleEscrow(escrowId: string) {
    if (this.mockMode) {
      await mockDelay(1000)
      return { signature: generateMockSignature(), confirmed: true }
    }

    const result = await ts!.marketplace.settleEscrow(escrowId as any)
    return { signature: result.signature || generateMockSignature(), confirmed: true }
  }

  async cancelEscrow(escrowId: string) {
    if (this.mockMode) {
      await mockDelay(600)
      return { signature: generateMockSignature(), confirmed: true }
    }

    const result = await ts!.marketplace.cancelEscrow(escrowId as any)
    return { signature: result.signature || generateMockSignature(), confirmed: true }
  }

  async getRoyaltyInfo(mintAddress: string) {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        mint: mintAddress,
        sellerFeeBasisPoints: 500,
        creators: [{ address: generateMockAddress(), share: 100, verified: true }],
        enforcedByMarketplace: true,
      }
    }

    const info = await ts!.marketplace.getRoyaltyInfo(mintAddress as any)
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

  async getActiveListings() {
    if (this.mockMode) {
      await mockDelay(400)
      return Array.from({ length: 3 }, () => ({
        id: generateMockUuid(),
        mint: generateMockAddress(),
        seller: generateMockAddress(),
        price: BigInt(Math.floor(Math.random() * 5 + 1) * 1000000000),
        currency: 'SOL',
        delegated: true,
        createdAt: Date.now() - Math.floor(Math.random() * 86400000),
        status: 'active',
      }))
    }

    return ts!.marketplace.getActiveListings()
  }

  // ============================================
  // Platform Fee Operations
  // ============================================

  calculatePlatformFee(salePriceLamports: bigint): { feeAmount: bigint; netAmount: bigint } {
    const config = tokensConfig as any
    const feeConfig = config.marketplace?.platformFee
    if (!feeConfig?.enabled || !feeConfig?.walletAddress) {
      return { feeAmount: BigInt(0), netAmount: salePriceLamports }
    }
    const bps = BigInt(feeConfig.basisPoints || 100)
    const feeAmount = (salePriceLamports * bps) / BigInt(10000)
    const netAmount = salePriceLamports - feeAmount
    return { feeAmount, netAmount }
  }

  // ============================================
  // Quick Mint (one-off NFT creation)
  // ============================================

  async buildQuickMintTransaction(config: {
    name: string
    symbol?: string
    uri?: string
    ownerAddress: string
    collection?: string
    sellerFeeBasisPoints?: number
  }): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'quick_mint',
          name: config.name,
          owner: config.ownerAddress,
          mock: true,
          timestamp: Date.now(),
        })),
        message: `Mint NFT: ${config.name}`,
      }
    }

    const result = await tsNft!.createNFT({
      name: config.name,
      symbol: config.symbol,
      uri: config.uri,
      collection: config.collection,
      sellerFeeBasisPoints: config.sellerFeeBasisPoints,
      buildOnly: true,
    } as any)
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return {
      serializedTransaction: serialized,
      message: `Mint NFT: ${config.name}`,
    }
  }

  // ============================================
  // Update NFT Metadata
  // ============================================

  async buildUpdateNFTTransaction(options: {
    mint: string
    name?: string
    symbol?: string
    uri?: string
    sellerFeeBasisPoints?: number
    ownerAddress: string
  }): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'update_nft',
          mint: options.mint,
          updates: { name: options.name, symbol: options.symbol, uri: options.uri },
          owner: options.ownerAddress,
          mock: true,
          timestamp: Date.now(),
        })),
        message: `Update NFT metadata`,
      }
    }

    const result = await tsNft!.updateNFTMetadata({
      mint: options.mint,
      name: options.name,
      symbol: options.symbol,
      uri: options.uri,
      sellerFeeBasisPoints: options.sellerFeeBasisPoints,
      buildOnly: true,
    } as any)
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return {
      serializedTransaction: serialized,
      message: 'Update NFT metadata',
    }
  }

  // ============================================
  // Batch Create NFTs
  // ============================================

  async batchCreateNFTs(
    nfts: Array<{ name: string; symbol?: string; uri?: string }>,
    options: { collection?: string; sellerFeeBasisPoints?: number; isMutable?: boolean },
    onProgress?: (completed: number, total: number) => void,
  ): Promise<Array<{ success: boolean; mint?: string; signature?: string; error?: string }>> {
    const results: Array<{ success: boolean; mint?: string; signature?: string; error?: string }> = []

    if (this.mockMode) {
      for (let i = 0; i < nfts.length; i++) {
        await mockDelay(200)
        results.push({
          success: true,
          mint: generateMockAddress(),
          signature: generateMockSignature(),
        })
        if (onProgress) onProgress(i + 1, nfts.length)
      }
      return results
    }

    try {
      const batchResult = await tsNft!.batchCreateSimpleNFTs({
        items: nfts,
        collection: options.collection,
        sellerFeeBasisPoints: options.sellerFeeBasisPoints,
        isMutable: options.isMutable ?? true,
        onProgress: onProgress ? (completed: number, total: number) => onProgress(completed, total) : undefined,
      } as any)

      if (Array.isArray(batchResult)) {
        for (const item of batchResult) {
          results.push({
            success: !item.error,
            mint: item.mint?.toString(),
            signature: item.signature?.toString(),
            error: item.error?.toString(),
          })
        }
      }
    }
    catch (error) {
      for (let i = results.length; i < nfts.length; i++) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Batch creation failed',
        })
      }
    }

    return results
  }

  // ============================================
  // Multi-Signature Operations
  // ============================================

  async createMultisig(config: {
    signers: string[]
    threshold: number
    name?: string
  }): Promise<{ address: string; signature: string }> {
    if (this.mockMode) {
      await mockDelay(800)
      return {
        address: generateMockAddress(),
        signature: generateMockSignature(),
      }
    }

    const result = await ts!.multisig.createMultisig({
      signers: config.signers,
      threshold: config.threshold,
    } as any)
    return {
      address: result.address?.toString() || generateMockAddress(),
      signature: result.signature?.toString() || generateMockSignature(),
    }
  }

  async buildMultisigTransaction(config: {
    multisigAddress: string
    instruction: any
  }): Promise<string> {
    if (this.mockMode) {
      await mockDelay(500)
      return btoa(JSON.stringify({
        type: 'multisig_tx',
        multisig: config.multisigAddress,
        mock: true,
        timestamp: Date.now(),
      }))
    }

    const result = await ts!.multisig.buildTransaction({
      multisigAddress: config.multisigAddress,
      instruction: config.instruction,
    } as any)
    return typeof result === 'string' ? result : btoa(String.fromCharCode(...new Uint8Array(result)))
  }

  async signMultisigTransaction(transactionData: string, signerAddress: string): Promise<{ signature: string }> {
    if (this.mockMode) {
      await mockDelay(400)
      return { signature: generateMockSignature() }
    }

    const result = await ts!.multisig.signTransaction({
      transaction: transactionData,
      signer: signerAddress,
    } as any)
    return { signature: result.signature?.toString() || generateMockSignature() }
  }

  async executeMultisigTransaction(transactionData: string): Promise<{ signature: string; status: string }> {
    if (this.mockMode) {
      await mockDelay(800)
      return {
        signature: generateMockSignature(),
        status: 'executed',
      }
    }

    const result = await ts!.multisig.executeTransaction({
      transaction: transactionData,
    } as any)
    return {
      signature: result.signature?.toString() || generateMockSignature(),
      status: 'executed',
    }
  }

  async canExecuteMultisig(collectedSignatures: number, requiredSignatures: number): Promise<boolean> {
    return collectedSignatures >= requiredSignatures
  }

  async cancelMultisigTransaction(transactionData: string): Promise<{ status: string }> {
    if (this.mockMode) {
      await mockDelay(400)
      return { status: 'cancelled' }
    }

    await ts!.multisig.cancelTransaction({
      transaction: transactionData,
    } as any)
    return { status: 'cancelled' }
  }

  // ============================================
  // Token Operations (Fungible)
  // ============================================

  async createToken(opts: {
    name: string
    symbol: string
    decimals: number
    initialSupply?: number
    uri?: string
    creators?: Array<{ address: string; share: number }>
    sellerFeeBasisPoints?: number
  }) {
    if (this.mockMode) {
      await mockDelay(800)
      return {
        mint: generateMockAddress(),
        metadata: generateMockAddress(),
        signature: generateMockSignature(),
      }
    }

    return ts!.createToken(opts as any)
  }

  async mintTokens(opts: {
    mintAddress: string
    amount: number
    destinationWallet: string
  }) {
    if (this.mockMode) {
      await mockDelay(600)
      return {
        signature: generateMockSignature(),
        amount: opts.amount,
        destination: opts.destinationWallet,
      }
    }

    const result = await ts!.mintTokens({
      mint: opts.mintAddress,
      amount: opts.amount,
      destination: opts.destinationWallet,
    } as any)
    return {
      signature: result.signature,
      amount: opts.amount,
      destination: opts.destinationWallet,
    }
  }

  async transferTokens(opts: {
    mintAddress: string
    amount: number
    fromWallet: string
    toWallet: string
  }) {
    if (this.mockMode) {
      await mockDelay(600)
      return {
        signature: generateMockSignature(),
        amount: opts.amount,
      }
    }

    const result = await ts!.transferTokens({
      mint: opts.mintAddress,
      amount: opts.amount,
      from: opts.fromWallet,
      to: opts.toWallet,
    } as any)
    return {
      signature: result.signature,
      amount: opts.amount,
    }
  }

  async getTokenInfo(mintAddress: string) {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        mint: mintAddress,
        supply: BigInt(1000000),
        decimals: 9,
        holders: Math.floor(Math.random() * 1000),
        metadata: {
          name: 'Mock Token',
          symbol: 'MOCK',
          uri: 'https://arweave.net/mock-token-metadata',
        },
      }
    }

    return ts!.getTokenInfo(mintAddress)
  }

  async getBalance(walletAddress: string) {
    if (this.mockMode) {
      await mockDelay(200)
      // Derive a deterministic balance from the wallet address so the same
      // wallet always returns the same mock balance across all API calls
      let hash = 0
      for (let i = 0; i < walletAddress.length; i++) {
        hash = ((hash << 5) - hash + walletAddress.charCodeAt(i)) | 0
      }
      const lamports = Math.abs(hash % 10_000_000_000) + 500_000_000 // 0.5–10.5 SOL
      return {
        sol: lamports / 1_000_000_000,
        lamports,
      }
    }

    const lamports = await ts!.getBalance(walletAddress)
    return {
      sol: Number(lamports) / 1_000_000_000,
      lamports: Number(lamports),
    }
  }

  // ============================================
  // Build Transaction Methods (server-builds, client-signs)
  // ============================================

  async buildListTransaction(mintAddress: string, price: bigint, sellerAddress: string): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'list',
          mint: mintAddress,
          price: price.toString(),
          seller: sellerAddress,
          mock: true,
          timestamp: Date.now(),
        })),
        message: `List NFT for ${Number(price) / 1e9} SOL`,
      }
    }

    const result = await ts!.marketplace.listNFT(
      { mint: mintAddress, price, currency: 'SOL', buildOnly: true } as any,
    )
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return {
      serializedTransaction: serialized,
      message: `List NFT for ${Number(price) / 1e9} SOL`,
    }
  }

  async buildBuyTransaction(mintAddress: string, buyerAddress: string): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'buy',
          mint: mintAddress,
          buyer: buyerAddress,
          mock: true,
          timestamp: Date.now(),
        })),
        message: 'Buy listed NFT',
      }
    }

    const result = await ts!.marketplace.buyListedNFT(
      mintAddress as any,
      { ...getTsTokensConfig(), buyerAddress, buildOnly: true } as any,
    )
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return { serializedTransaction: serialized, message: 'Buy listed NFT' }
  }

  async buildDelistTransaction(mintAddress: string, sellerAddress: string): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'delist',
          mint: mintAddress,
          seller: sellerAddress,
          mock: true,
          timestamp: Date.now(),
        })),
        message: 'Delist NFT from marketplace',
      }
    }

    const result = await ts!.marketplace.delistNFT(
      mintAddress as any,
      { ...getTsTokensConfig(), buildOnly: true } as any,
    )
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return { serializedTransaction: serialized, message: 'Delist NFT from marketplace' }
  }

  async buildMintTransaction(candyMachineAddress: string, payerAddress: string): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'mint',
          candyMachine: candyMachineAddress,
          payer: payerAddress,
          mock: true,
          timestamp: Date.now(),
        })),
        message: 'Mint NFT from candy machine',
      }
    }

    const result = await ts!.mintFromCandyMachine({
      candyMachine: candyMachineAddress,
      payerAddress,
      buildOnly: true,
    } as any)
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return { serializedTransaction: serialized, message: 'Mint NFT from candy machine' }
  }

  async buildAcceptOfferTransaction(offerId: string, sellerAddress: string): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'accept_offer',
          offerId,
          seller: sellerAddress,
          mock: true,
          timestamp: Date.now(),
        })),
        message: 'Accept offer on NFT',
      }
    }

    const result = await ts!.marketplace.acceptOffer(
      offerId as any,
      { ...getTsTokensConfig(), buildOnly: true } as any,
    )
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return { serializedTransaction: serialized, message: 'Accept offer on NFT' }
  }

  async buildCancelAuctionTransaction(auctionId: string, sellerAddress: string): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'cancel_auction',
          auctionId,
          seller: sellerAddress,
          mock: true,
          timestamp: Date.now(),
        })),
        message: 'Cancel auction',
      }
    }

    const result = await ts!.marketplace.cancelAuction(
      auctionId as any,
      { ...getTsTokensConfig(), buildOnly: true } as any,
    )
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return { serializedTransaction: serialized, message: 'Cancel auction' }
  }

  async buildCreateEscrowTransaction(mintAddress: string, sellerAddress: string, price: bigint): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'create_escrow',
          mint: mintAddress,
          seller: sellerAddress,
          price: price.toString(),
          mock: true,
          timestamp: Date.now(),
        })),
        message: `Create escrow for ${Number(price) / 1e9} SOL`,
      }
    }

    const result = await ts!.marketplace.createEscrow(
      { mint: mintAddress, price, sellerAddress, buildOnly: true } as any,
    )
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return { serializedTransaction: serialized, message: `Create escrow for ${Number(price) / 1e9} SOL` }
  }

  async buildSettleEscrowTransaction(escrowId: string, buyerAddress: string): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'settle_escrow',
          escrowId,
          buyer: buyerAddress,
          mock: true,
          timestamp: Date.now(),
        })),
        message: 'Settle escrow and transfer NFT',
      }
    }

    const result = await ts!.marketplace.settleEscrow(
      escrowId as any,
      { ...getTsTokensConfig(), buyerAddress, buildOnly: true } as any,
    )
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return { serializedTransaction: serialized, message: 'Settle escrow and transfer NFT' }
  }

  async buildCancelEscrowTransaction(escrowId: string, sellerAddress: string): Promise<UnsignedTransaction> {
    if (this.mockMode) {
      await mockDelay(300)
      return {
        serializedTransaction: btoa(JSON.stringify({
          type: 'cancel_escrow',
          escrowId,
          seller: sellerAddress,
          mock: true,
          timestamp: Date.now(),
        })),
        message: 'Cancel escrow and return NFT',
      }
    }

    const result = await ts!.marketplace.settleEscrow(
      escrowId as any,
      { ...getTsTokensConfig(), sellerAddress, buildOnly: true, cancel: true } as any,
    )
    const serialized = typeof result.serializedTransaction === 'string'
      ? result.serializedTransaction
      : btoa(String.fromCharCode(...new Uint8Array(result.serializedTransaction)))

    return { serializedTransaction: serialized, message: 'Cancel escrow and return NFT' }
  }

  // ============================================
  // Transaction Verification
  // ============================================

  async verifyTransaction(signature: string): Promise<{ confirmed: boolean; slot?: number; err?: string }> {
    if (this.mockMode) {
      await mockDelay(300)
      return { confirmed: true, slot: Math.floor(Math.random() * 1000000) }
    }

    try {
      const connection = this.getConnection()
      const result = await connection.connection.getSignatureStatuses([signature])
      const status = result?.value?.[0]

      if (!status) {
        return { confirmed: false, err: 'Transaction not found' }
      }
      if (status.err) {
        return { confirmed: false, err: JSON.stringify(status.err) }
      }

      const confirmed = status.confirmationStatus === 'confirmed'
        || status.confirmationStatus === 'finalized'

      return { confirmed, slot: status.slot }
    }
    catch (error) {
      return {
        confirmed: false,
        err: error instanceof Error ? error.message : 'Verification failed',
      }
    }
  }

  // ============================================
  // Storage Operations
  // ============================================

  async uploadMetadata(metadata: {
    name: string
    symbol: string
    description?: string
    image: string
    animation_url?: string
    external_url?: string
    attributes?: Array<{ trait_type: string; value: string | number }>
    properties?: { files?: Array<{ uri: string; type: string }>; category?: string; creators?: Array<{ address: string; share: number }> }
  }) {
    if (this.mockMode) {
      await mockDelay(500)
      const mockId = `mock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      return {
        id: mockId,
        url: `https://arweave.net/${mockId}`,
        provider: tokensConfig.storageProvider,
      }
    }

    const storage = ts!.getStorageAdapter(tokensConfig.storageProvider as any)
    const wallet = await ts!.loadWallet(tokensConfig.wallet.keypairPath)
    const result = await storage.uploadJson(metadata, { wallet })

    return {
      id: result.id,
      url: result.url,
      provider: tokensConfig.storageProvider,
    }
  }

  async uploadImage(filePath: string) {
    if (this.mockMode) {
      await mockDelay(600)
      const mockId = `mock_img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      return {
        id: mockId,
        url: `https://arweave.net/${mockId}`,
        provider: tokensConfig.storageProvider,
      }
    }

    const storage = ts!.getStorageAdapter(tokensConfig.storageProvider as any)
    const wallet = await ts!.loadWallet(tokensConfig.wallet.keypairPath)
    const file = Bun.file(filePath)
    const buffer = await file.arrayBuffer()

    const result = await storage.uploadFile(Buffer.from(buffer), {
      wallet,
      contentType: file.type,
    })

    return {
      id: result.id,
      url: result.url,
      provider: tokensConfig.storageProvider,
    }
  }

  // ============================================
  // Merkle Tree Operations (for Allowlists)
  // ============================================

  generateMerkleRoot(addresses: string[]): Uint8Array {
    const leaves = addresses.map(addr => this.hashLeaf(addr))
    return this.buildMerkleTreeHelper(leaves)
  }

  generateMerkleProof(
    address: string,
    addresses: string[],
  ): { proof: Uint8Array[]; leaf: Uint8Array } {
    const leaf = this.hashLeaf(address)
    const leaves = addresses.map(addr => this.hashLeaf(addr))
    const proof = this.buildMerkleProofHelper(leaf, leaves)
    return { proof, leaf }
  }

  verifyMerkleProof(
    proof: Uint8Array[],
    leaf: Uint8Array,
    root: Uint8Array,
  ): boolean {
    let computedHash = leaf
    for (const proofElement of proof) {
      if (this.compareBytes(computedHash, proofElement) < 0) {
        computedHash = this.hashPair(computedHash, proofElement)
      }
      else {
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
    const hasher = new Bun.CryptoHasher('sha256')
    hasher.update(data)
    return new Uint8Array(hasher.digest())
  }

  private buildMerkleTreeHelper(leaves: Uint8Array[]): Uint8Array {
    if (leaves.length === 0) return new Uint8Array(32)
    if (leaves.length === 1) return leaves[0]!

    const sortedLeaves = [...leaves].sort(this.compareBytes)
    let currentLayer = sortedLeaves
    while (currentLayer.length > 1) {
      const nextLayer: Uint8Array[] = []
      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          nextLayer.push(this.hashPair(currentLayer[i]!, currentLayer[i + 1]!))
        }
        else {
          nextLayer.push(currentLayer[i]!)
        }
      }
      currentLayer = nextLayer
    }
    return currentLayer[0]!
  }

  private buildMerkleProofHelper(leaf: Uint8Array, leaves: Uint8Array[]): Uint8Array[] {
    const sortedLeaves = [...leaves].sort(this.compareBytes)
    const proof: Uint8Array[] = []

    let index = sortedLeaves.findIndex(l => this.bytesEqual(l, leaf))
    if (index === -1) return proof

    let currentLayer = sortedLeaves
    while (currentLayer.length > 1) {
      const nextLayer: Uint8Array[] = []
      const siblingIndex = index % 2 === 0 ? index + 1 : index - 1

      if (siblingIndex >= 0 && siblingIndex < currentLayer.length) {
        proof.push(currentLayer[siblingIndex]!)
      }

      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          nextLayer.push(this.hashPair(currentLayer[i]!, currentLayer[i + 1]!))
        }
        else {
          nextLayer.push(currentLayer[i]!)
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
      if (a[i]! !== b[i]!) return a[i]! - b[i]!
    }
    return a.length - b.length
  }

  private bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i]! !== b[i]!) return false
    }
    return true
  }
}

/**
 * Create a new TokenService instance
 */
export function createTokenService(): TokenService {
  return new TokenService()
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
