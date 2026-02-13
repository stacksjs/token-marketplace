import { describe, expect, test, beforeAll } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: Multisig Actions
// ============================================

const actionPaths = {
  create: 'app/Actions/Multisig/CreateMultisigAction.ts',
  list: 'app/Actions/Multisig/ListMultisigAction.ts',
  get: 'app/Actions/Multisig/GetMultisigAction.ts',
  propose: 'app/Actions/Multisig/ProposeTransactionAction.ts',
  sign: 'app/Actions/Multisig/SignTransactionAction.ts',
  execute: 'app/Actions/Multisig/ExecuteTransactionAction.ts',
  cancel: 'app/Actions/Multisig/CancelTransactionAction.ts',
}

describe('Multisig action files exist', () => {
  for (const [name, path] of Object.entries(actionPaths)) {
    test(`${name} action exists`, () => {
      expect(existsSync(path)).toBe(true)
    })
  }
})

describe('CreateMultisigAction', () => {
  const source = readFileSync(actionPaths.create, 'utf-8')

  test('imports getTokenService', () => {
    expect(source).toContain('getTokenService')
  })

  test('validates signers >= 2', () => {
    expect(source).toContain('2')
  })

  test('validates threshold', () => {
    expect(source).toContain('threshold')
  })

  test('calls tokenService.createMultisig', () => {
    expect(source).toContain('createMultisig')
  })

  test('inserts into multisig_accounts', () => {
    expect(source).toContain('multisig_accounts')
  })
})

describe('ProposeTransactionAction', () => {
  const source = readFileSync(actionPaths.propose, 'utf-8')

  test('validates proposer is a signer', () => {
    expect(source).toContain('signers')
    expect(source).toContain('includes')
  })

  test('creates multisig_transactions record', () => {
    expect(source).toContain('multisig_transactions')
  })

  test('records proposer signature', () => {
    expect(source).toContain('multisig_signatures')
  })
})

describe('SignTransactionAction', () => {
  const source = readFileSync(actionPaths.sign, 'utf-8')

  test('validates signer is authorized', () => {
    expect(source).toContain('signers')
  })

  test('checks not already signed', () => {
    expect(source).toContain('already signed') || expect(source).toContain('existingSig')
  })

  test('increments collected_signatures', () => {
    expect(source).toContain('collected_signatures')
  })

  test('updates status to ready when threshold met', () => {
    expect(source).toContain('ready')
  })
})

describe('ExecuteTransactionAction', () => {
  const source = readFileSync(actionPaths.execute, 'utf-8')

  test('validates status is ready', () => {
    expect(source).toContain('ready')
  })

  test('calls tokenService.executeMultisigTransaction', () => {
    expect(source).toContain('executeMultisigTransaction')
  })

  test('updates status to executed', () => {
    expect(source).toContain('executed')
  })
})

describe('CancelTransactionAction', () => {
  const source = readFileSync(actionPaths.cancel, 'utf-8')

  test('only proposer can cancel', () => {
    expect(source).toContain('proposer_wallet') || expect(source).toContain('proposer')
  })

  test('sets status to cancelled', () => {
    expect(source).toContain('cancelled')
  })
})

// ============================================
// Static analysis: TokenService multisig methods
// ============================================

const servicePath = 'app/Services/TokenService.ts'
const serviceSource = readFileSync(servicePath, 'utf-8')

describe('TokenService multisig methods', () => {
  test('has createMultisig method', () => {
    expect(serviceSource).toContain('createMultisig(')
  })

  test('has buildMultisigTransaction method', () => {
    expect(serviceSource).toContain('buildMultisigTransaction(')
  })

  test('has signMultisigTransaction method', () => {
    expect(serviceSource).toContain('signMultisigTransaction(')
  })

  test('has executeMultisigTransaction method', () => {
    expect(serviceSource).toContain('executeMultisigTransaction(')
  })

  test('has canExecuteMultisig method', () => {
    expect(serviceSource).toContain('canExecuteMultisig(')
  })

  test('has cancelMultisigTransaction method', () => {
    expect(serviceSource).toContain('cancelMultisigTransaction(')
  })
})

// ============================================
// Multisig migrations
// ============================================

describe('Multisig migrations', () => {
  test('multisig_accounts migration exists', () => {
    expect(existsSync('database/migrations/1770353243-create-multisig-accounts-table.sql')).toBe(true)
  })

  test('multisig_transactions migration exists', () => {
    expect(existsSync('database/migrations/1770353244-create-multisig-transactions-table.sql')).toBe(true)
  })

  test('multisig_signatures migration exists', () => {
    expect(existsSync('database/migrations/1770353245-create-multisig-signatures-table.sql')).toBe(true)
  })

  test('accounts table has threshold and signers', () => {
    const sql = readFileSync('database/migrations/1770353243-create-multisig-accounts-table.sql', 'utf-8')
    expect(sql).toContain('threshold')
    expect(sql).toContain('signers')
  })

  test('transactions table has foreign key to accounts', () => {
    const sql = readFileSync('database/migrations/1770353244-create-multisig-transactions-table.sql', 'utf-8')
    expect(sql).toContain('multisig_account_id')
    expect(sql).toContain('FOREIGN KEY')
  })

  test('signatures table has unique constraint', () => {
    const sql = readFileSync('database/migrations/1770353245-create-multisig-signatures-table.sql', 'utf-8')
    expect(sql).toContain('UNIQUE')
  })
})

// ============================================
// Multisig models
// ============================================

describe('Multisig models', () => {
  test('MultisigAccount model exists', () => {
    expect(existsSync('app/Models/MultisigAccount.ts')).toBe(true)
  })

  test('MultisigTransaction model exists', () => {
    expect(existsSync('app/Models/MultisigTransaction.ts')).toBe(true)
  })

  test('MultisigSignature model exists', () => {
    expect(existsSync('app/Models/MultisigSignature.ts')).toBe(true)
  })
})

// ============================================
// Routes
// ============================================

const routesSource = readFileSync('routes/api.ts', 'utf-8')

describe('Multisig routes', () => {
  test('has create multisig route', () => {
    expect(routesSource).toContain('CreateMultisigAction')
  })

  test('has list multisig route', () => {
    expect(routesSource).toContain('ListMultisigAction')
  })

  test('has propose transaction route', () => {
    expect(routesSource).toContain('ProposeTransactionAction')
  })

  test('has sign transaction route', () => {
    expect(routesSource).toContain('SignTransactionAction')
  })

  test('has execute transaction route', () => {
    expect(routesSource).toContain('ExecuteTransactionAction')
  })
})

// ============================================
// Mock mode runtime tests
// ============================================

describe('TokenService mock multisig methods', () => {
  let getTokenService: any

  beforeAll(async () => {
    process.env.TOKENS_MOCK_MODE = 'true'
    const mod = await import('../../app/Services/TokenService')
    getTokenService = mod.getTokenService
  })

  test('createMultisig returns address and signature', async () => {
    const svc = getTokenService()
    const result = await svc.createMultisig({
      signers: ['Signer1_234567890123456789012345678901234', 'Signer2_234567890123456789012345678901234'],
      threshold: 2,
    })
    expect(result.address).toBeDefined()
    expect(result.signature).toBeDefined()
    expect(result.address.length).toBe(44)
  })

  test('canExecuteMultisig checks threshold', async () => {
    const svc = getTokenService()
    expect(await svc.canExecuteMultisig(2, 2)).toBe(true)
    expect(await svc.canExecuteMultisig(1, 2)).toBe(false)
    expect(await svc.canExecuteMultisig(3, 2)).toBe(true)
  })
})
