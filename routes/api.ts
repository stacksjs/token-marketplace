import { response, route } from '@stacksjs/router'

// Skip auth for admin marketplace routes on devnet (for local testing)
const isDevnet = (typeof Bun !== 'undefined' ? Bun.env : process.env).SOLANA_NETWORK === 'devnet'

/**
 * This file is the entry point for your application's API routes.
 * The routes defined here are automatically registered.
 *
 * @see https://docs.stacksjs.com/routing
 */

// Basic routes
route.get('/', () => response.text('Token Marketplace API'))

// Serve static JS assets
route.get('/js/{filename}', async (req: any) => {
  const filename = req.getParam('filename')
  if (!filename || filename.includes('..')) return response.json({ error: 'Not found' }, 404)
  const path = await import('node:path')
  const fs = await import('node:fs')
  const filePath = path.resolve('public/js', filename)
  if (!fs.existsSync(filePath)) return response.json({ error: 'Not found' }, 404)
  const content = fs.readFileSync(filePath, 'utf-8')
  return new Response(content, { headers: { 'Content-Type': 'application/javascript' } })
})
route.health() // adds a GET `/health` route
route.get('/api/info', 'Actions/Api/InfoAction')

// Email subscription endpoint
route.post('/api/email/subscribe', 'Actions/SubscriberEmailAction')

// Authentication routes
route.post('/login', 'Actions/Auth/LoginAction')
route.post('/register', 'Actions/Auth/RegisterAction')
route.get('/generate-registration-options', 'Actions/Auth/GenerateRegistrationAction')
route.post('/verify-registration', 'Actions/Auth/VerifyRegistrationAction')
route.get('/generate-authentication-options', 'Actions/Auth/GenerateAuthenticationAction')
route.get('/verify-authentication', 'Actions/Auth/VerifyAuthenticationAction')

// Token management routes
route.group({ prefix: '/auth' }, () => {
  // Public - refresh token (no auth middleware needed)
  route.post('/refresh', 'Actions/Auth/RefreshTokenAction')

  // Protected - requires authentication
  route.get('/tokens', 'Actions/Auth/ListTokensAction').middleware('auth')
  route.post('/token', 'Actions/Auth/CreateTokenAction').middleware('auth')
  route.delete('/tokens/{id}', 'Actions/Auth/RevokeTokenAction').middleware('auth')
  route.get('/abilities', 'Actions/Auth/TestAbilitiesAction').middleware('auth')
})

// Password Reset routes
route.group({ prefix: '/password' }, () => {
  route.post('/forgot', 'Actions/Password/SendPasswordResetEmailAction')
  route.post('/reset', 'Actions/Password/PasswordResetAction')
  route.post('/verify-token', 'Actions/Password/VerifyResetTokenAction')
})

// Authenticated user routes
route.group({ middleware: 'auth' }, () => {
  route.get('/me', 'Actions/Auth/AuthUserAction')
  route.post('/logout', 'Actions/Auth/LogoutAction')
  route.post('/auth/link-wallet', 'Actions/Auth/LinkWalletAction')
})

// Dashboard routes
route.group({ prefix: '/dashboard' }, () => {
  route.get('/stats', 'Actions/Dashboard/DashboardStatsAction')
  route.get('/activity', 'Actions/Dashboard/DashboardActivityAction')
  route.get('/health', 'Actions/Dashboard/DashboardHealthAction')
})

// Queue routes
route.group({ prefix: '/queues' }, () => {
  route.get('/', 'Actions/Queue/FetchQueuesAction')
})

// Error Tracking / Monitoring routes
route.group({ prefix: '/monitoring' }, () => {
  route.get('/errors', 'Actions/Monitoring/ErrorIndexAction')
  route.get('/errors/stats', 'Actions/Monitoring/ErrorStatsAction')
  route.get('/errors/timeline', 'Actions/Monitoring/ErrorTimelineAction')
  route.get('/errors/group', 'Actions/Monitoring/ErrorGroupAction')
  route.get('/errors/{id}', 'Actions/Monitoring/ErrorShowAction')
  route.patch('/errors/resolve', 'Actions/Monitoring/ErrorResolveAction')
  route.patch('/errors/ignore', 'Actions/Monitoring/ErrorIgnoreAction')
  route.patch('/errors/unresolve', 'Actions/Monitoring/ErrorUnresolveAction')
  route.delete('/errors', 'Actions/Monitoring/ErrorDestroyAction')
})

// Wallet routes (public)
route.post('/wallet/connect', 'Actions/Wallet/ConnectWalletAction')
route.post('/wallet/disconnect', 'Actions/Wallet/DisconnectWalletAction')
route.get('/wallet/balance/{walletAddress}', 'Actions/Wallet/GetBalanceAction')

// NFT Marketplace routes (public)
route.group({ prefix: '/marketplace' }, () => {
  // Home page data - all data needed for the landing page
  route.get('/home', 'Actions/Marketplace/HomePageDataAction')

  // Collections
  route.get('/collections', 'Actions/Marketplace/CollectionIndexAction')
  route.get('/collections/{slug}', 'Actions/Marketplace/CollectionShowAction')
  route.get('/collections/{slug}/nfts', 'Actions/Marketplace/CollectionNftsAction')
  route.get('/collections/{slug}/stats', 'Actions/Marketplace/CollectionStatsAction')
  route.get('/collections/{slug}/attributes', 'Actions/Marketplace/CollectionAttributesAction')

  // Collection minting page
  route.get('/collections/mint/{slug}', 'Actions/Marketplace/ShowMintingCollectionAction')

  // NFTs
  route.get('/nfts', 'Actions/Marketplace/NftIndexAction')
  route.get('/nfts/{id}', 'Actions/Marketplace/NftShowAction')
  route.get('/nfts/{id}/history', 'Actions/Marketplace/NftHistoryAction')
  route.get('/nfts/{id}/offers', 'Actions/Marketplace/NftOffersAction')
  route.get('/nfts/{id}/traits', 'Actions/Marketplace/NftTraitsAction')

  // Rarity data
  route.get('/rarity', 'Actions/Marketplace/RarityIndexAction')
  route.get('/rarity/{slug}', 'Actions/Marketplace/RarityShowAction')

  // Activity feed
  route.get('/activity', 'Actions/Marketplace/ActivityFeedAction')
  route.get('/activity/{collectionSlug}', 'Actions/Marketplace/ActivityFeedAction')

  // Create collection on-chain (auth skipped on devnet for local testing)
  if (isDevnet) {
    route.post('/collections/create', 'Actions/Marketplace/CreateCollectionAction')
    route.post('/collections/sync', 'Actions/Marketplace/SyncCollectionAction')
    route.post('/collections/sync/batch', 'Actions/Marketplace/SyncCollectionsBatchAction')
    route.post('/collections/discover', 'Actions/Marketplace/DiscoverCollectionsAction')
    route.post('/nfts/mint-to-collection', 'Actions/Marketplace/MintNftToCollectionAction')
  }
  else {
    route.post('/collections/create', 'Actions/Marketplace/CreateCollectionAction').middleware('auth')
    route.post('/collections/sync', 'Actions/Marketplace/SyncCollectionAction').middleware('auth')
    route.post('/collections/sync/batch', 'Actions/Marketplace/SyncCollectionsBatchAction').middleware('auth')
    route.post('/collections/discover', 'Actions/Marketplace/DiscoverCollectionsAction').middleware('auth')
    route.post('/nfts/mint-to-collection', 'Actions/Marketplace/MintNftToCollectionAction').middleware('auth')
  }

  // Collection stats update (admin - requires authentication)
  route.post('/collections/stats', 'Actions/Marketplace/UpdateCollectionStatsAction').middleware('auth')

  // Analytics & Holders (Phase 11)
  route.get('/collections/{slug}/analytics', 'Actions/Marketplace/CollectionAnalyticsAction')
  route.get('/collections/{slug}/holders', 'Actions/Marketplace/CollectionHoldersAction')

  // Auctions (Phase 10)
  route.get('/auctions/active', 'Actions/Marketplace/ActiveAuctionsAction')
  route.get('/auctions/ended', 'Actions/Marketplace/EndedAuctionsAction')
  route.get('/auctions/{id}', 'Actions/Marketplace/AuctionDetailAction')
  route.get('/auctions/{id}/bids', 'Actions/Marketplace/AuctionBidsAction')

  // Batch operations (Phase 9)
  route.post('/nfts/batch-list', 'Actions/Marketplace/BatchListAction')
  route.post('/nfts/batch-buy', 'Actions/Marketplace/BatchBuyAction')

  // Collection-wide offers & counter-offers (Phase 9)
  route.post('/offers/collection', 'Actions/Marketplace/CollectionOfferAction')
  route.post('/offers/counter', 'Actions/Marketplace/CounterOfferAction')

  // User profile
  route.get('/profile/{walletAddress}', 'Actions/Marketplace/ProfileAction')
})

// Candy Machine routes (admin - requires authentication)
route.group({ prefix: '/candy-machine', middleware: 'auth' }, () => {
  route.post('/', 'Actions/CandyMachine/CreateCandyMachineAction')
  route.post('/{id}/config-lines', 'Actions/CandyMachine/AddConfigLinesAction')
  route.get('/{id}', 'Actions/CandyMachine/GetCandyMachineAction')
  route.patch('/{id}/status', 'Actions/CandyMachine/UpdateCandyMachineStatusAction')
  route.post('/{id}/sync', 'Actions/CandyMachine/SyncCandyMachineAction')
  route.post('/{id}/guards', 'Actions/CandyMachine/ManageGuardsAction')
  route.post('/{id}/upload', 'Actions/CandyMachine/UploadConfigLinesAction')
})

// Minting routes (public)
route.group({ prefix: '/mint' }, () => {
  route.post('/', 'Actions/Mint/MintNftAction')
  route.post('/verify', 'Actions/Mint/VerifyMintAction')
  route.get('/status/{transactionId}', 'Actions/Mint/GetMintStatusAction')
})

// Presale routes
route.get('/presale/{uuid}', 'Actions/Presale/ShowPresaleAction')
route.post('/presale/check-eligibility', 'Actions/Presale/CheckPresaleEligibilityAction')

route.group({ prefix: '/presale', middleware: 'auth' }, () => {
  route.post('/', 'Actions/Presale/CreatePresaleAction')
  route.patch('/{id}', 'Actions/Presale/UpdatePresaleAction')
})

// NFT secondary market routes
route.post('/nfts/buy', 'Actions/Nft/BuyNftAction')
route.post('/nfts/list', 'Actions/Nft/ListNftAction')
route.post('/nfts/delist', 'Actions/Nft/DelistNftAction')
route.post('/nfts/confirm', 'Actions/Nft/ConfirmTransactionAction')
route.post('/nfts/offer', 'Actions/Nft/MakeOfferAction')
route.post('/nfts/offer/accept', 'Actions/Nft/AcceptOfferAction')
route.post('/nfts/offer/cancel', 'Actions/Nft/CancelOfferAction')
route.post('/nfts/auction', 'Actions/Nft/CreateAuctionAction')
route.post('/nfts/auction/bid', 'Actions/Nft/PlaceBidAction')
route.post('/nfts/auction/settle', 'Actions/Nft/SettleAuctionAction')
route.post('/nfts/auction/cancel', 'Actions/Nft/CancelAuctionAction')

// Escrow routes
route.post('/nfts/escrow', 'Actions/Nft/CreateEscrowAction')
route.post('/nfts/escrow/settle', 'Actions/Nft/SettleEscrowAction')
route.post('/nfts/escrow/cancel', 'Actions/Nft/CancelEscrowAction')

// Fungible Token routes (admin - requires authentication)
route.group({ prefix: '/token', middleware: 'auth' }, () => {
  route.post('/create', 'Actions/Token/CreateTokenAction')
  route.post('/mint', 'Actions/Token/MintTokensAction')
  route.post('/transfer', 'Actions/Token/TransferTokensAction')
  route.get('/{mintAddress}', 'Actions/Token/GetTokenInfoAction')
})

// Quick Mint (requires authentication)
route.post('/mint/quick', 'Actions/Mint/QuickMintAction').middleware('auth')

// NFT metadata update and bulk create (requires authentication)
route.post('/nfts/update', 'Actions/Nft/UpdateNftMetadataAction').middleware('auth')
route.post('/nfts/bulk-create', 'Actions/Nft/BulkCreateNftsAction').middleware('auth')

// Wallet authentication (public - no auth needed)
route.post('/auth/wallet/challenge', 'Actions/Auth/WalletChallengeAction')
route.post('/auth/wallet/verify', 'Actions/Auth/WalletVerifyAction')

// Admin fee stats (requires authentication)
route.get('/admin/fees', 'Actions/Admin/PlatformFeeStatsAction').middleware('auth')

// Multisig routes (requires authentication)
route.group({ prefix: '/multisig', middleware: 'auth' }, () => {
  route.post('/', 'Actions/Multisig/CreateMultisigAction')
  route.get('/', 'Actions/Multisig/ListMultisigAction')
  route.get('/{id}', 'Actions/Multisig/GetMultisigAction')
  route.post('/propose', 'Actions/Multisig/ProposeTransactionAction')
  route.post('/sign', 'Actions/Multisig/SignTransactionAction')
  route.post('/execute', 'Actions/Multisig/ExecuteTransactionAction')
  route.post('/cancel', 'Actions/Multisig/CancelTransactionAction')
})
