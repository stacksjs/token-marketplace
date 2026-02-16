import { Action } from '@stacksjs/actions'
import { response } from '@stacksjs/router'

export default new Action({
  name: 'API Info',
  description: 'List all available API endpoints for documentation and discovery',
  method: 'GET',

  async handle() {
    return response.json({
      name: 'Naked NFTs Marketplace API',
      version: '1.0.0',
      endpoints: {
        health: {
          'GET /health': 'Health check',
        },
        auth: {
          'POST /login': 'Login with email/password',
          'POST /register': 'Register new account',
          'POST /auth/refresh': 'Refresh JWT token',
          'POST /auth/wallet/challenge': 'Request wallet auth challenge nonce',
          'POST /auth/wallet/verify': 'Verify wallet signature and get JWT',
          'GET /me': 'Get authenticated user (auth required)',
          'POST /logout': 'Logout (auth required)',
          'POST /auth/link-wallet': 'Link wallet to account (auth required)',
        },
        marketplace: {
          'GET /marketplace/home': 'Home page data (featured, popular, available NFTs)',
          'GET /marketplace/collections': 'List collections (supports search, pagination)',
          'GET /marketplace/collections/{slug}': 'Get collection details by slug',
          'GET /marketplace/collections/mint/{slug}': 'Get minting collection page data',
          'GET /marketplace/nfts': 'List NFTs (supports search, pagination)',
          'GET /marketplace/nfts/{id}': 'Get NFT details by ID',
          'GET /marketplace/rarity': 'List collections with rarity data',
          'GET /marketplace/rarity/{slug}': 'Get rarity data for collection',
          'GET /marketplace/activity': 'Activity feed (mints, sales, offers)',
          'GET /marketplace/activity/{collectionSlug}': 'Activity feed filtered by collection',
          'GET /marketplace/profile/{walletAddress}': 'User profile by wallet address',
          'POST /marketplace/collections/stats': 'Update collection stats (auth required)',
        },
        nft: {
          'POST /nfts/buy': 'Build buy transaction',
          'POST /nfts/list': 'Build list transaction',
          'POST /nfts/delist': 'Build delist transaction',
          'POST /nfts/confirm': 'Confirm on-chain transaction and update DB',
          'POST /nfts/offer': 'Make an offer on an NFT',
          'POST /nfts/offer/accept': 'Accept an offer',
          'POST /nfts/offer/cancel': 'Cancel an offer',
          'POST /nfts/auction': 'Create an auction',
          'POST /nfts/auction/bid': 'Place a bid',
          'POST /nfts/auction/settle': 'Settle a completed auction',
          'POST /nfts/auction/cancel': 'Cancel an active auction',
          'POST /nfts/escrow': 'Create escrow for NFT sale',
          'POST /nfts/escrow/settle': 'Settle escrow',
          'POST /nfts/escrow/cancel': 'Cancel escrow',
          'POST /nfts/update': 'Update NFT metadata (auth required)',
          'POST /nfts/bulk-create': 'Bulk create NFTs (auth required)',
        },
        minting: {
          'POST /mint': 'Build mint transaction from candy machine',
          'POST /mint/verify': 'Verify a mint transaction',
          'GET /mint/status/{transactionId}': 'Get mint transaction status',
          'POST /mint/quick': 'Quick mint a single NFT (auth required)',
        },
        candyMachine: {
          'POST /candy-machine': 'Deploy candy machine (auth required)',
          'POST /candy-machine/{id}/config-lines': 'Add config lines (auth required)',
          'GET /candy-machine/{id}': 'Get candy machine info (auth required)',
          'PATCH /candy-machine/{id}/status': 'Update status (auth required)',
          'POST /candy-machine/{id}/sync': 'Sync on-chain state (auth required)',
          'POST /candy-machine/{id}/guards': 'Manage guards (auth required)',
          'POST /candy-machine/{id}/upload': 'Upload config lines (auth required)',
        },
        presale: {
          'GET /presale/{uuid}': 'Get presale details',
          'POST /presale/check-eligibility': 'Check presale eligibility',
          'POST /presale': 'Create presale (auth required)',
          'PATCH /presale/{id}': 'Update presale (auth required)',
        },
        wallet: {
          'POST /wallet/connect': 'Connect wallet',
          'POST /wallet/disconnect': 'Disconnect wallet',
          'GET /wallet/balance/{walletAddress}': 'Get wallet balance',
        },
        multisig: {
          'POST /multisig': 'Create multisig account (auth required)',
          'GET /multisig': 'List multisig accounts (auth required)',
          'GET /multisig/{id}': 'Get multisig details (auth required)',
          'POST /multisig/propose': 'Propose transaction (auth required)',
          'POST /multisig/sign': 'Sign transaction (auth required)',
          'POST /multisig/execute': 'Execute transaction (auth required)',
          'POST /multisig/cancel': 'Cancel transaction (auth required)',
        },
        admin: {
          'GET /admin/fees': 'Platform fee statistics (auth required)',
          'POST /token/create': 'Create fungible token (auth required)',
          'POST /token/mint': 'Mint fungible tokens (auth required)',
          'POST /token/transfer': 'Transfer fungible tokens (auth required)',
          'GET /token/{mintAddress}': 'Get token info (auth required)',
        },
      },
    })
  },
})
