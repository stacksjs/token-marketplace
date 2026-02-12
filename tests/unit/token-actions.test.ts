import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Token Actions static analysis tests
// ============================================

describe('Token Actions file structure', () => {
  const actionFiles = [
    'app/Actions/Token/CreateTokenAction.ts',
    'app/Actions/Token/MintTokensAction.ts',
    'app/Actions/Token/TransferTokensAction.ts',
    'app/Actions/Token/GetTokenInfoAction.ts',
  ]

  for (const filePath of actionFiles) {
    const fileName = filePath.split('/').pop()!

    test(`${fileName} exists`, () => {
      expect(existsSync(filePath)).toBe(true)
    })

    test(`${fileName} imports from TokenService`, () => {
      const source = readFileSync(filePath, 'utf-8')
      expect(source).toContain("from '../../Services/TokenService'")
      expect(source).toContain('getTokenService')
    })

    test(`${fileName} exports an Action`, () => {
      const source = readFileSync(filePath, 'utf-8')
      expect(source).toContain('export default new Action(')
    })

    test(`${fileName} has error handling`, () => {
      const source = readFileSync(filePath, 'utf-8')
      expect(source).toContain('catch')
      expect(source).toContain('error')
    })
  }
})

describe('CreateTokenAction', () => {
  const source = readFileSync('app/Actions/Token/CreateTokenAction.ts', 'utf-8')

  test('validates required fields', () => {
    expect(source).toContain('name')
    expect(source).toContain('symbol')
    expect(source).toContain('decimals')
  })

  test('calls tokenService.createToken', () => {
    expect(source).toContain('tokenService.createToken')
  })

  test('is a POST method', () => {
    expect(source).toContain("method: 'POST'")
  })
})

describe('MintTokensAction', () => {
  const source = readFileSync('app/Actions/Token/MintTokensAction.ts', 'utf-8')

  test('validates required fields', () => {
    expect(source).toContain('mintAddress')
    expect(source).toContain('amount')
    expect(source).toContain('destinationWallet')
  })

  test('validates amount is positive', () => {
    expect(source).toContain('amount <= 0')
  })

  test('calls tokenService.mintTokens', () => {
    expect(source).toContain('tokenService.mintTokens')
  })
})

describe('TransferTokensAction', () => {
  const source = readFileSync('app/Actions/Token/TransferTokensAction.ts', 'utf-8')

  test('validates required fields', () => {
    expect(source).toContain('mintAddress')
    expect(source).toContain('amount')
    expect(source).toContain('fromWallet')
    expect(source).toContain('toWallet')
  })

  test('prevents same-wallet transfer', () => {
    expect(source).toContain('fromWallet === toWallet')
  })

  test('calls tokenService.transferTokens', () => {
    expect(source).toContain('tokenService.transferTokens')
  })
})

describe('GetTokenInfoAction', () => {
  const source = readFileSync('app/Actions/Token/GetTokenInfoAction.ts', 'utf-8')

  test('validates mint address', () => {
    expect(source).toContain('mintAddress')
    expect(source).toContain('length < 32')
  })

  test('calls tokenService.getTokenInfo', () => {
    expect(source).toContain('tokenService.getTokenInfo')
  })

  test('is a GET method', () => {
    expect(source).toContain("method: 'GET'")
  })
})

describe('GetBalanceAction update', () => {
  const source = readFileSync('app/Actions/Wallet/GetBalanceAction.ts', 'utf-8')

  test('uses TokenService instead of direct RPC', () => {
    expect(source).toContain('getTokenService')
    expect(source).toContain('tokenService.getBalance')
    expect(source).not.toContain('jsonrpc')
    expect(source).not.toContain('getBalance.*params')
  })
})

describe('Routes include token endpoints', () => {
  const routeSource = readFileSync('routes/api.ts', 'utf-8')

  test('has /token route group', () => {
    expect(routeSource).toContain("/token")
  })

  test('has create token route', () => {
    expect(routeSource).toContain("'/create', 'Actions/Token/CreateTokenAction'")
  })

  test('has mint tokens route', () => {
    expect(routeSource).toContain("'/mint', 'Actions/Token/MintTokensAction'")
  })

  test('has transfer tokens route', () => {
    expect(routeSource).toContain("'/transfer', 'Actions/Token/TransferTokensAction'")
  })

  test('has get token info route', () => {
    expect(routeSource).toContain("'/{mintAddress}', 'Actions/Token/GetTokenInfoAction'")
  })

  test('token routes require auth', () => {
    expect(routeSource).toContain("prefix: '/token', middleware: 'auth'")
  })
})

describe('Config tokens.ts has ts-tokens helper', () => {
  const configSource = readFileSync('config/tokens.ts', 'utf-8')

  test('exports getTsTokensConfig function', () => {
    expect(configSource).toContain('export function getTsTokensConfig()')
  })

  test('getTsTokensConfig includes required fields', () => {
    expect(configSource).toContain("chain: 'solana'")
    expect(configSource).toContain('network:')
    expect(configSource).toContain('rpcUrl:')
    expect(configSource).toContain('commitment:')
    expect(configSource).toContain('wallet:')
    expect(configSource).toContain('storage:')
  })
})
