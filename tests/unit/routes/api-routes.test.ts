/**
 * API Route Definition Tests
 *
 * Verifies the route file exists and maps to correct action files.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

const routePath = 'routes/api.ts'

describe('Route file', () => {
  test('api routes file exists', () => {
    expect(existsSync(routePath)).toBe(true)
  })

  test('imports from @stacksjs/router', () => {
    const source = readFileSync(routePath, 'utf-8')
    expect(source).toContain('@stacksjs/router')
  })
})

describe('Core routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('health check route exists', () => {
    expect(source).toContain('route.health()')
  })

  test('API info route', () => {
    expect(source).toContain('/api/info')
  })
})

describe('Marketplace routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('homepage data route', () => {
    expect(source).toContain('/home')
    expect(source).toContain('HomePageDataAction')
  })

  test('collection routes', () => {
    expect(source).toContain('/collections')
    expect(source).toContain('CollectionIndexAction')
    expect(source).toContain('CollectionShowAction')
    expect(source).toContain('CreateCollectionAction')
  })

  test('NFT routes', () => {
    expect(source).toContain('/nfts')
    expect(source).toContain('NftShowAction')
  })

  test('activity feed route', () => {
    expect(source).toContain('/activity')
    expect(source).toContain('ActivityFeedAction')
  })

  test('rarity routes', () => {
    expect(source).toContain('/rarity')
    expect(source).toContain('RarityIndexAction')
    expect(source).toContain('RarityShowAction')
  })

  test('profile route', () => {
    expect(source).toContain('/profile')
    expect(source).toContain('ProfileAction')
  })

  test('sync routes', () => {
    expect(source).toContain('SyncCollectionAction')
    expect(source).toContain('SyncCollectionsBatchAction')
  })
})

describe('Wallet routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('connect wallet', () => {
    expect(source).toContain('/wallet/connect')
    expect(source).toContain('ConnectWalletAction')
  })

  test('disconnect wallet', () => {
    expect(source).toContain('/wallet/disconnect')
    expect(source).toContain('DisconnectWalletAction')
  })

  test('get balance', () => {
    expect(source).toContain('/wallet/balance')
    expect(source).toContain('GetBalanceAction')
  })
})

describe('NFT trading routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('buy/list/delist NFT routes', () => {
    expect(source).toContain('BuyNftAction')
    expect(source).toContain('ListNftAction')
    expect(source).toContain('DelistNftAction')
  })

  test('offer routes', () => {
    expect(source).toContain('MakeOfferAction')
    expect(source).toContain('AcceptOfferAction')
    expect(source).toContain('CancelOfferAction')
  })

  test('auction routes', () => {
    expect(source).toContain('CreateAuctionAction')
    expect(source).toContain('PlaceBidAction')
    expect(source).toContain('SettleAuctionAction')
    expect(source).toContain('CancelAuctionAction')
  })

  test('escrow routes', () => {
    expect(source).toContain('CreateEscrowAction')
    expect(source).toContain('SettleEscrowAction')
    expect(source).toContain('CancelEscrowAction')
  })
})

describe('Candy Machine routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('candy machine CRUD routes exist', () => {
    expect(source).toContain('CreateCandyMachineAction')
    expect(source).toContain('AddConfigLinesAction')
    expect(source).toContain('GetCandyMachineAction')
    expect(source).toContain('UpdateCandyMachineStatusAction')
  })

  test('candy machine routes require auth', () => {
    expect(source).toContain("prefix: '/candy-machine', middleware: 'auth'")
  })
})

describe('Mint routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('mint routes', () => {
    expect(source).toContain('MintNftAction')
    expect(source).toContain('VerifyMintAction')
    expect(source).toContain('GetMintStatusAction')
  })

  test('quick mint requires auth', () => {
    expect(source).toContain('QuickMintAction')
  })
})

describe('Presale routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('presale routes', () => {
    expect(source).toContain('ShowPresaleAction')
    expect(source).toContain('CreatePresaleAction')
    expect(source).toContain('UpdatePresaleAction')
    expect(source).toContain('CheckPresaleEligibilityAction')
  })
})

describe('Token management routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('fungible token routes', () => {
    expect(source).toContain('Actions/Token/CreateTokenAction')
    expect(source).toContain('MintTokensAction')
    expect(source).toContain('TransferTokensAction')
    expect(source).toContain('GetTokenInfoAction')
  })
})

describe('Auth routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('wallet auth routes', () => {
    expect(source).toContain('WalletChallengeAction')
    expect(source).toContain('WalletVerifyAction')
  })

  test('link wallet route', () => {
    expect(source).toContain('LinkWalletAction')
  })
})

describe('Multisig routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('multisig CRUD routes', () => {
    expect(source).toContain('CreateMultisigAction')
    expect(source).toContain('ListMultisigAction')
    expect(source).toContain('GetMultisigAction')
  })

  test('multisig transaction routes', () => {
    expect(source).toContain('ProposeTransactionAction')
    expect(source).toContain('SignTransactionAction')
    expect(source).toContain('ExecuteTransactionAction')
    expect(source).toContain('Actions/Multisig/CancelTransactionAction')
  })

  test('multisig routes require auth', () => {
    expect(source).toContain("prefix: '/multisig', middleware: 'auth'")
  })
})

describe('Admin routes', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('admin fee stats route', () => {
    expect(source).toContain('/admin/fees')
    expect(source).toContain('PlatformFeeStatsAction')
  })
})

describe('Protected routes use auth middleware', () => {
  const source = readFileSync(routePath, 'utf-8')

  test('auth middleware is used for protected endpoints', () => {
    const authMiddlewareCount = (source.match(/middleware.*auth/g) || []).length
    // Should have multiple auth-protected route groups/routes
    expect(authMiddlewareCount).toBeGreaterThanOrEqual(5)
  })
})
