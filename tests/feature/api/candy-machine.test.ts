import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const actionsPath = join(process.cwd(), 'app/Actions/CandyMachine')

describe('Candy Machine API Actions', () => {
  describe('CreateCandyMachineAction', () => {
    const actionPath = join(actionsPath, 'CreateCandyMachineAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Create Candy Machine'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates required fields', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('collectionId')
      expect(content).toContain('itemsAvailable')
      expect(content).toContain('symbol')
      expect(content).toContain('creatorAddress')
      expect(content).toContain('collectionMint')
    })

    test('checks collection exists', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Collection not found')
    })

    test('returns 400 for missing required fields', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Missing required fields')
      expect(content).toContain('400')
    })

    test('creates candy machine in database', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("insertInto('candy_machines')")
    })

    test('deploys candy machine on-chain via tokenService', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.createCandyMachine')
    })

    test('returns 201 on success', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('201')
    })

    test('handles deployment failure', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Failed to create candy machine')
      expect(content).toContain("status: 'failed'")
    })
  })

  describe('GetCandyMachineAction', () => {
    const actionPath = join(actionsPath, 'GetCandyMachineAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Get Candy Machine'")
    })

    test('uses GET method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'GET'")
    })

    test('gets id from request params', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("getParam('id')")
    })

    test('handles not found', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Candy machine not found')
    })

    test('returns stats', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('stats')
      expect(content).toContain('totalMints')
      expect(content).toContain('itemsRemaining')
      expect(content).toContain('percentMinted')
    })

    test('returns recentMints', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('recentMints')
    })

    test('uses getCandyMachineInfo for on-chain data', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('getCandyMachineInfo')
    })
  })

  describe('SyncCandyMachineAction', () => {
    const actionPath = join(actionsPath, 'SyncCandyMachineAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Sync Candy Machine'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('uses getCandyMachineInfo', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('getCandyMachineInfo')
    })

    test('detects sold out status', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('sold_out')
    })

    test('returns sync change tracking', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('changes')
      expect(content).toContain('itemsRedeemedChanged')
      expect(content).toContain('itemsAvailableChanged')
      expect(content).toContain('statusChanged')
    })

    test('handles undeployed candy machine', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Candy machine has not been deployed yet')
    })
  })

  describe('ManageGuardsAction', () => {
    const actionPath = join(actionsPath, 'ManageGuardsAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Manage Guards'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates guards config is required', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('guards configuration object is required')
    })

    test('supports add, update, and remove actions', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('addGuards')
      expect(content).toContain('updateGuards')
      expect(content).toContain('removeGuards')
    })

    test('supports solPayment guard', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('solPayment')
    })

    test('supports startDate guard', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('startDate')
    })

    test('supports mintLimit guard', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('mintLimit')
    })

    test('supports allowList guard with merkle root', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('allowList')
      expect(content).toContain('generateMerkleRoot')
    })

    test('stores guards config in database', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('guards_config')
      expect(content).toContain('JSON.stringify(guards)')
    })
  })

  describe('UploadConfigLinesAction', () => {
    const actionPath = join(actionsPath, 'UploadConfigLinesAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Upload Config Lines'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates items array is required', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('items array is required')
    })

    test('validates each item has name and uri', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('must have both name and uri')
    })

    test('processes batch items via tokenService', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.addConfigLines')
    })

    test('returns upload results with batch count', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('uploaded')
      expect(content).toContain('batches')
    })
  })

  describe('AddConfigLinesAction', () => {
    const actionPath = join(actionsPath, 'AddConfigLinesAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Add Config Lines'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates configLines array', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('configLines array is required and must not be empty')
    })

    test('validates config line structure', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Each config line must have name and uri properties')
    })

    test('checks candy machine status before adding', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Cannot add config lines when candy machine status is')
    })

    test('returns lines added count', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('linesAdded')
      expect(content).toContain('startIndex')
    })
  })

  describe('UpdateCandyMachineStatusAction', () => {
    const actionPath = join(actionsPath, 'UpdateCandyMachineStatusAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Update Candy Machine Status'")
    })

    test('uses PATCH method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'PATCH'")
    })

    test('validates status is required', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('status is required')
    })

    test('defines valid statuses', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('not_started')
      expect(content).toContain('ready')
      expect(content).toContain('minting')
      expect(content).toContain('paused')
      expect(content).toContain('sold_out')
    })

    test('enforces valid status transitions', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('STATUS_TRANSITIONS')
      expect(content).toContain('Cannot transition from')
    })

    test('updates collection minting status', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('is_minting')
    })
  })
})

describe('Candy Machine API Routes', () => {
  const routesPath = join(process.cwd(), 'routes/api.ts')

  test('routes file exists', () => {
    expect(existsSync(routesPath)).toBe(true)
  })

  test('has candy-machine route group with auth middleware', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("prefix: '/candy-machine'")
    expect(content).toContain("middleware: 'auth'")
  })

  test('has create candy machine route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/', 'Actions/CandyMachine/CreateCandyMachineAction')")
  })

  test('has add config lines route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/{id}/config-lines', 'Actions/CandyMachine/AddConfigLinesAction')")
  })

  test('has get candy machine route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.get('/{id}', 'Actions/CandyMachine/GetCandyMachineAction')")
  })

  test('has update status route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.patch('/{id}/status', 'Actions/CandyMachine/UpdateCandyMachineStatusAction')")
  })

  test('has sync route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/{id}/sync', 'Actions/CandyMachine/SyncCandyMachineAction')")
  })

  test('has guards route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/{id}/guards', 'Actions/CandyMachine/ManageGuardsAction')")
  })

  test('has upload route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/{id}/upload', 'Actions/CandyMachine/UploadConfigLinesAction')")
  })
})
