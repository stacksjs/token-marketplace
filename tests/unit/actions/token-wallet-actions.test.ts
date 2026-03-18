/**
 * Token, Wallet, Mint, Presale & Multisig Actions - Static Analysis Tests
 *
 * Verifies all supporting action files exist.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Token Actions
// ============================================

describe('CreateTokenAction', () => {
  const path = 'app/Actions/Token/CreateTokenAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('uses tokenService', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('tokenService')
  })
})

describe('MintTokensAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Token/MintTokensAction.ts')).toBe(true)
  })
})

describe('TransferTokensAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Token/TransferTokensAction.ts')).toBe(true)
  })
})

describe('GetTokenInfoAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Token/GetTokenInfoAction.ts')).toBe(true)
  })
})

// ============================================
// Wallet Actions
// ============================================

describe('ConnectWalletAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Wallet/ConnectWalletAction.ts')).toBe(true)
  })
})

describe('DisconnectWalletAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Wallet/DisconnectWalletAction.ts')).toBe(true)
  })
})

describe('GetBalanceAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Wallet/GetBalanceAction.ts')).toBe(true)
  })
})

// ============================================
// Auth Actions
// ============================================

describe('WalletChallengeAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Auth/WalletChallengeAction.ts')).toBe(true)
  })
})

describe('WalletVerifyAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Auth/WalletVerifyAction.ts')).toBe(true)
  })
})

describe('LinkWalletAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Auth/LinkWalletAction.ts')).toBe(true)
  })
})

// ============================================
// Mint Actions
// ============================================

describe('MintNftAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Mint/MintNftAction.ts')).toBe(true)
  })
})

describe('VerifyMintAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Mint/VerifyMintAction.ts')).toBe(true)
  })
})

describe('GetMintStatusAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Mint/GetMintStatusAction.ts')).toBe(true)
  })
})

describe('QuickMintAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Mint/QuickMintAction.ts')).toBe(true)
  })
})

// ============================================
// Presale Actions
// ============================================

describe('CreatePresaleAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Presale/CreatePresaleAction.ts')).toBe(true)
  })
})

describe('UpdatePresaleAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Presale/UpdatePresaleAction.ts')).toBe(true)
  })
})

describe('ShowPresaleAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Presale/ShowPresaleAction.ts')).toBe(true)
  })
})

describe('CheckPresaleEligibilityAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Presale/CheckPresaleEligibilityAction.ts')).toBe(true)
  })
})

// ============================================
// Multisig Actions
// ============================================

describe('CreateMultisigAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Multisig/CreateMultisigAction.ts')).toBe(true)
  })
})

describe('ListMultisigAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Multisig/ListMultisigAction.ts')).toBe(true)
  })
})

describe('GetMultisigAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Multisig/GetMultisigAction.ts')).toBe(true)
  })
})

describe('ProposeTransactionAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Multisig/ProposeTransactionAction.ts')).toBe(true)
  })
})

describe('SignTransactionAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Multisig/SignTransactionAction.ts')).toBe(true)
  })
})

describe('ExecuteTransactionAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Multisig/ExecuteTransactionAction.ts')).toBe(true)
  })
})

describe('CancelTransactionAction (Multisig)', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Multisig/CancelTransactionAction.ts')).toBe(true)
  })
})

// ============================================
// Admin Actions
// ============================================

describe('PlatformFeeStatsAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Admin/PlatformFeeStatsAction.ts')).toBe(true)
  })
})

// ============================================
// API Info Action
// ============================================

describe('InfoAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/Api/InfoAction.ts')).toBe(true)
  })
})
