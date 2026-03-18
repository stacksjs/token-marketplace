/**
 * Candy Machine Actions - Static Analysis Tests
 *
 * Verifies candy machine action files exist and contain expected patterns.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

describe('CreateCandyMachineAction', () => {
  const path = 'app/Actions/CandyMachine/CreateCandyMachineAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('uses tokenService', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('tokenService')
  })
})

describe('AddConfigLinesAction', () => {
  const path = 'app/Actions/CandyMachine/AddConfigLinesAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('handles config line data', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('config')
  })
})

describe('GetCandyMachineAction', () => {
  const path = 'app/Actions/CandyMachine/GetCandyMachineAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })
})

describe('ManageGuardsAction', () => {
  const path = 'app/Actions/CandyMachine/ManageGuardsAction.ts'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('handles guard operations', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('guard')
  })
})

describe('SyncCandyMachineAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/CandyMachine/SyncCandyMachineAction.ts')).toBe(true)
  })
})

describe('UpdateCandyMachineStatusAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/CandyMachine/UpdateCandyMachineStatusAction.ts')).toBe(true)
  })
})

describe('UploadConfigLinesAction', () => {
  test('file exists', () => {
    expect(existsSync('app/Actions/CandyMachine/UploadConfigLinesAction.ts')).toBe(true)
  })
})
