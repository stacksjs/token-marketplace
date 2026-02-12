import { response, route } from '@stacksjs/router'

/**
 * This file is the entry point for your application's API routes.
 * The routes defined here are automatically registered.
 *
 * @see https://docs.stacksjs.com/routing
 */

// Basic routes
route.get('/', () => response.text('Token Marketplace API'))
route.health() // adds a GET `/health` route

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

  // Collection minting page
  route.get('/collections/mint/{slug}', 'Actions/Marketplace/ShowMintingCollectionAction')

  // NFTs
  route.get('/nfts', 'Actions/Marketplace/NftIndexAction')
  route.get('/nfts/{id}', 'Actions/Marketplace/NftShowAction')

  // Rarity data
  route.get('/rarity', 'Actions/Marketplace/RarityIndexAction')
  route.get('/rarity/{slug}', 'Actions/Marketplace/RarityShowAction')

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
route.post('/nfts/offer', 'Actions/Nft/MakeOfferAction')
route.post('/nfts/offer/accept', 'Actions/Nft/AcceptOfferAction')
route.post('/nfts/offer/cancel', 'Actions/Nft/CancelOfferAction')
route.post('/nfts/auction', 'Actions/Nft/CreateAuctionAction')
route.post('/nfts/auction/bid', 'Actions/Nft/PlaceBidAction')
route.post('/nfts/auction/settle', 'Actions/Nft/SettleAuctionAction')
