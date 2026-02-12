// Use direct environment variable access to avoid circular dependencies
const envVars = typeof Bun !== 'undefined' ? Bun.env : process.env

// Network-aware RPC URL defaults
const network = envVars.SOLANA_NETWORK || 'devnet'
const defaultRpcUrls: Record<string, string> = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
}

/**
 * **Token/NFT Configuration**
 *
 * This configuration defines settings for token and NFT operations,
 * including Solana network settings, wallet configuration, and storage providers.
 */
export default {
  /**
   * Mock mode - when enabled, skips real blockchain calls
   * Useful for development and testing without Solana setup
   */
  mockMode: envVars.TOKENS_MOCK_MODE === 'true' || envVars.TOKENS_MOCK_MODE === '1',

  /**
   * Blockchain network configuration
   */
  chain: 'solana',
  network,
  rpcUrl: envVars.SOLANA_RPC_URL || defaultRpcUrls[network] || defaultRpcUrls.devnet,

  /**
   * Wallet configuration
   */
  wallet: {
    keypairPath: envVars.SOLANA_KEYPAIR_PATH || '~/.config/solana/id.json',
  },

  /**
   * Transaction confirmation settings
   */
  commitment: (envVars.SOLANA_COMMITMENT || 'confirmed') as 'processed' | 'confirmed' | 'finalized',

  /**
   * Storage provider configuration
   * Supported providers: 'arweave', 'ipfs', 'shadow-drive', 'local'
   */
  storageProvider: envVars.STORAGE_PROVIDER || 'arweave',

  storage: {
    arweave: {
      gateway: envVars.ARWEAVE_GATEWAY || 'https://arweave.net',
      host: envVars.ARWEAVE_HOST || 'arweave.net',
      port: Number(envVars.ARWEAVE_PORT) || 443,
      protocol: envVars.ARWEAVE_PROTOCOL || 'https',
      walletPath: envVars.ARWEAVE_WALLET_PATH,
    },

    ipfs: {
      gateway: envVars.IPFS_GATEWAY || 'https://ipfs.io',
      pinataApiKey: envVars.PINATA_API_KEY,
      pinataSecretApiKey: envVars.PINATA_SECRET_API_KEY,
      infuraProjectId: envVars.INFURA_PROJECT_ID,
      infuraProjectSecret: envVars.INFURA_PROJECT_SECRET,
    },

    shadowDrive: {
      endpoint: envVars.SHADOW_DRIVE_ENDPOINT || 'https://shadow-storage.genesysgo.net',
    },

    local: {
      basePath: envVars.LOCAL_STORAGE_PATH || './storage/uploads',
      baseUrl: envVars.LOCAL_STORAGE_URL || 'http://localhost:3000/uploads',
    },
  },

  /**
   * Candy Machine configuration defaults
   */
  candyMachine: {
    // Default seller fee in basis points (500 = 5%)
    defaultSellerFee: Number(envVars.DEFAULT_SELLER_FEE) || 500,
    // Maximum number of config lines to add per batch
    maxConfigLinesBatchSize: Number(envVars.MAX_CONFIG_LINES_BATCH_SIZE) || 10,
    // Default symbol length
    defaultSymbolLength: 4,
    // Auto-verify creators on mint
    autoVerifyCreators: envVars.AUTO_VERIFY_CREATORS !== 'false',
  },

  /**
   * Metadata configuration
   */
  metadata: {
    // Cache metadata fetches for this many milliseconds
    cacheTtl: Number(envVars.METADATA_CACHE_TTL) || 300000, // 5 minutes
    // Maximum retries for fetching off-chain metadata
    maxFetchRetries: Number(envVars.METADATA_MAX_RETRIES) || 3,
    // Timeout for metadata fetch requests in milliseconds
    fetchTimeout: Number(envVars.METADATA_FETCH_TIMEOUT) || 10000,
  },

  /**
   * Rarity calculation configuration
   */
  rarity: {
    // Recalculate rarity when this many new NFTs are added
    recalculateThreshold: Number(envVars.RARITY_RECALC_THRESHOLD) || 100,
    // Enable automatic rarity recalculation
    autoRecalculate: envVars.AUTO_RECALCULATE_RARITY !== 'false',
  },

  /**
   * Rate limiting for blockchain operations
   */
  rateLimiting: {
    // Maximum mints per wallet per minute
    mintsPerWalletPerMinute: Number(envVars.MINTS_PER_WALLET_PER_MINUTE) || 5,
    // Maximum config lines upload per minute
    configLinesPerMinute: Number(envVars.CONFIG_LINES_PER_MINUTE) || 100,
  },

  /**
   * Marketplace configuration
   */
  marketplace: {
    // Default currency for listings
    defaultCurrency: envVars.MARKETPLACE_DEFAULT_CURRENCY || 'SOL',
    // Enforce royalties on secondary sales
    enforceRoyalties: envVars.MARKETPLACE_ENFORCE_ROYALTIES !== 'false',
    // Default royalty basis points (500 = 5%)
    defaultRoyaltyBasisPoints: Number(envVars.MARKETPLACE_DEFAULT_ROYALTY_BPS) || 500,
    // Listing expiry in seconds (0 = no expiry)
    defaultListingExpiry: Number(envVars.MARKETPLACE_LISTING_EXPIRY) || 0,
    // Offer expiry in seconds (default 7 days)
    defaultOfferExpiry: Number(envVars.MARKETPLACE_OFFER_EXPIRY) || 604800,
    // Minimum auction duration in seconds (default 1 hour)
    minAuctionDuration: Number(envVars.MARKETPLACE_MIN_AUCTION_DURATION) || 3600,
    // Maximum auction duration in seconds (default 30 days)
    maxAuctionDuration: Number(envVars.MARKETPLACE_MAX_AUCTION_DURATION) || 2592000,
  },

  /**
   * Guard defaults for candy machines
   */
  guards: {
    // Default bot tax in lamports (0.01 SOL)
    defaultBotTax: BigInt(envVars.GUARD_DEFAULT_BOT_TAX || '10000000'),
    // Whether to enforce start date by default
    enforceStartDate: envVars.GUARD_ENFORCE_START_DATE === 'true',
    // Default mint limit per wallet (0 = no limit)
    defaultMintLimit: Number(envVars.GUARD_DEFAULT_MINT_LIMIT) || 0,
  },
}

/**
 * Extract the ts-tokens compatible configuration subset.
 * Pass the result directly to `ts.setConfig()`.
 */
export function getTsTokensConfig() {
  return {
    chain: 'solana' as const,
    network: (envVars.SOLANA_NETWORK || 'devnet') as 'mainnet-beta' | 'devnet' | 'testnet',
    rpcUrl: envVars.SOLANA_RPC_URL || defaultRpcUrls[envVars.SOLANA_NETWORK || 'devnet'] || defaultRpcUrls.devnet,
    commitment: (envVars.SOLANA_COMMITMENT || 'confirmed') as 'processed' | 'confirmed' | 'finalized',
    wallet: {
      keypairPath: envVars.SOLANA_KEYPAIR_PATH || '~/.config/solana/id.json',
    },
    storageProvider: (envVars.STORAGE_PROVIDER || 'arweave') as 'arweave' | 'ipfs' | 'shadow-drive' | 'local',
    storage: {
      provider: (envVars.STORAGE_PROVIDER || 'arweave') as 'arweave' | 'ipfs' | 'shadow-drive' | 'local',
      arweave: {
        gateway: envVars.ARWEAVE_GATEWAY || 'https://arweave.net',
      },
      ipfs: {
        gateway: envVars.IPFS_GATEWAY || 'https://ipfs.io',
      },
      local: {
        baseDir: envVars.LOCAL_STORAGE_PATH || './storage/uploads',
        baseUrl: envVars.LOCAL_STORAGE_URL || 'http://localhost:3000/uploads',
      },
    },
  }
}
