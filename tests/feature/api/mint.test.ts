import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const mintActionsPath = join(process.cwd(), 'app/Actions/Mint')
const presaleActionsPath = join(process.cwd(), 'app/Actions/Presale')

describe('Minting API Actions', () => {
  describe('MintNftAction', () => {
    const actionPath = join(mintActionsPath, 'MintNftAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Mint NFT'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates required fields', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('candyMachineId')
      expect(content).toContain('walletAddress')
      expect(content).toContain('candyMachineId and walletAddress are required')
    })

    test('checks candy machine is in minting status', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Minting is not active')
    })

    test('checks items remaining before minting', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('No items remaining to mint')
    })

    test('creates mint transaction record', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("insertInto('mint_transactions')")
      expect(content).toContain("status: 'pending'")
    })

    test('executes mint via tokenService', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.mintFromCandyMachine')
    })

    test('returns 201 on successful mint', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('201')
      expect(content).toContain('mintAddress')
      expect(content).toContain('transactionSignature')
    })

    test('handles presale eligibility', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('presaleId')
      expect(content).toContain('presale_starts_at')
      expect(content).toContain('Wallet is not in presale allowlist')
    })

    test('applies presale discount', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('discount')
    })

    test('checks max mints per wallet for presale', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('max_mints_per_wallet')
      expect(content).toContain('Maximum mints per wallet')
    })

    test('detects sold out after minting', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("status: 'sold_out'")
      expect(content).toContain('All items have been minted')
    })

    test('handles mint failure', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Mint failed')
      expect(content).toContain("status: 'failed'")
    })
  })

  describe('VerifyMintAction', () => {
    const actionPath = join(mintActionsPath, 'VerifyMintAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Verify Mint'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('accepts transactionId or transactionSignature', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('transactionId')
      expect(content).toContain('transactionSignature')
      expect(content).toContain('transactionId or transactionSignature is required')
    })

    test('handles not found mint transaction', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Mint transaction not found')
    })

    test('returns verified status for confirmed transactions', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('verified')
      expect(content).toContain("mintTransaction.status === 'confirmed'")
    })

    test('returns processing status for pending transactions', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Transaction is still being processed')
    })
  })

  describe('GetMintStatusAction', () => {
    const actionPath = join(mintActionsPath, 'GetMintStatusAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Get Mint Status'")
    })

    test('uses GET method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'GET'")
    })

    test('gets transactionId from request params', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("getParam('transactionId')")
    })

    test('handles not found mint transaction', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Mint transaction not found')
    })

    test('returns transaction details', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('transaction')
      expect(content).toContain('toCamelCase(mintTransaction)')
    })

    test('returns associated NFT if minted', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('nft')
      expect(content).toContain('mintTransaction.nft_id')
    })

    test('returns candy machine info', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('candyMachine')
      expect(content).toContain('mintTransaction.candy_machine_id')
    })
  })
})

describe('Presale API Actions', () => {
  describe('CreatePresaleAction', () => {
    const actionPath = join(presaleActionsPath, 'CreatePresaleAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Create Presale'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates collectionId is required', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('collectionId is required')
    })

    test('validates wallet addresses array', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('walletAddresses must be an array')
    })

    test('validates discount is in basis points range', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('discount must be between 0 and 10000')
    })

    test('validates presale dates ordering', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('presaleStartsAt must be before presaleExpiresAt')
    })

    test('generates merkle root for wallet addresses', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('generateMerkleRoot')
      expect(content).toContain('merkleRoot')
    })

    test('creates presale in database', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("insertInto('presales')")
    })

    test('updates collection presale status when active', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('is_presale_happening')
    })

    test('returns 201 on success', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('201')
    })
  })

  describe('ShowPresaleAction', () => {
    const actionPath = join(presaleActionsPath, 'ShowPresaleAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Show Presale'")
    })

    test('uses GET method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'GET'")
    })

    test('gets uuid from request params', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("getParam('uuid')")
    })

    test('handles not found', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Presale not found')
    })

    test('calculates presale status', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("status = 'upcoming'")
      expect(content).toContain("status = 'expired'")
      expect(content).toContain("status = 'active'")
    })

    test('calculates discounted price', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('discountedPrice')
      expect(content).toContain('originalPrice')
    })

    test('does not expose full wallet list', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('delete presaleData.walletAddresses')
      expect(content).toContain('walletCount')
    })

    test('returns stats with items available and remaining', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('totalMints')
      expect(content).toContain('itemsAvailable')
      expect(content).toContain('itemsRemaining')
    })
  })

  describe('CheckPresaleEligibilityAction', () => {
    const actionPath = join(presaleActionsPath, 'CheckPresaleEligibilityAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Check Presale Eligibility'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates walletAddress is required', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('walletAddress is required')
    })

    test('requires presaleId or collectionId', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('presaleId or collectionId is required')
    })

    test('checks allowlist membership', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('isInAllowlist')
      expect(content).toContain('Wallet is not in allowlist')
    })

    test('checks timing status', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('timingStatus')
      expect(content).toContain('not_started')
      expect(content).toContain('expired')
    })

    test('checks max mints remaining', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('mintsRemaining')
      expect(content).toContain('Maximum mints reached')
    })

    test('calculates discount and price information', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('discountPercentage')
      expect(content).toContain('discountedPrice')
      expect(content).toContain('originalPrice')
    })

    test('returns overall eligibility across multiple presales', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('overallEligible')
      expect(content).toContain('eligibilityResults')
    })
  })

  describe('UpdatePresaleAction', () => {
    const actionPath = join(presaleActionsPath, 'UpdatePresaleAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Update Presale'")
    })

    test('uses PATCH method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'PATCH'")
    })

    test('gets presale id from request params', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("getParam('id')")
    })

    test('handles not found', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Presale not found')
    })

    test('validates wallet addresses array', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('walletAddresses must be an array')
    })

    test('regenerates merkle root on wallet update', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('generateMerkleRoot')
    })

    test('validates discount range', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('discount must be between 0 and 10000')
    })

    test('validates maxMintsPerWallet minimum', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('maxMintsPerWallet must be at least 1')
    })

    test('validates date ordering', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('presaleStartsAt must be before presaleExpiresAt')
    })

    test('updates collection presale status', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('is_presale_happening')
    })

    test('checks for other active presales before deactivating collection', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('otherActivePresales')
    })
  })
})

describe('Minting API Routes', () => {
  const routesPath = join(process.cwd(), 'routes/api.ts')

  test('routes file exists', () => {
    expect(existsSync(routesPath)).toBe(true)
  })

  test('has mint route group', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("prefix: '/mint'")
  })

  test('has mint NFT route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/', 'Actions/Mint/MintNftAction')")
  })

  test('has verify mint route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/verify', 'Actions/Mint/VerifyMintAction')")
  })

  test('has mint status route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.get('/status/{transactionId}', 'Actions/Mint/GetMintStatusAction')")
  })
})

describe('Presale API Routes', () => {
  const routesPath = join(process.cwd(), 'routes/api.ts')

  test('has show presale route (public)', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.get('/presale/{uuid}', 'Actions/Presale/ShowPresaleAction')")
  })

  test('has check eligibility route (public)', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/presale/check-eligibility', 'Actions/Presale/CheckPresaleEligibilityAction')")
  })

  test('has presale group with auth middleware', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("prefix: '/presale'")
    expect(content).toContain("middleware: 'auth'")
  })

  test('has create presale route (auth)', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/', 'Actions/Presale/CreatePresaleAction')")
  })

  test('has update presale route (auth)', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.patch('/{id}', 'Actions/Presale/UpdatePresaleAction')")
  })
})
