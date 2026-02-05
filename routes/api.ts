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

// NFT Marketplace routes (public)
route.group({ prefix: '/marketplace' }, () => {
  // Home page data - all data needed for the landing page
  route.get('/home', 'Actions/Marketplace/HomePageDataAction')

  // Collections
  route.get('/collections', 'Actions/Marketplace/CollectionIndexAction')
  route.get('/collections/{slug}', 'Actions/Marketplace/CollectionShowAction')

  // NFTs
  route.get('/nfts', 'Actions/Marketplace/NftIndexAction')
  route.get('/nfts/{id}', 'Actions/Marketplace/NftShowAction')

  // Rarity data
  route.get('/rarity', 'Actions/Marketplace/RarityIndexAction')
  route.get('/rarity/{slug}', 'Actions/Marketplace/RarityShowAction')
})
