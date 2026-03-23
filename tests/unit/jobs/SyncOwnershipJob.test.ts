import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify SyncOwnershipJob structure
// ============================================

const jobPath = 'app/Jobs/SyncOwnershipJob.ts'
const jobSource = readFileSync(jobPath, 'utf-8')

describe('SyncOwnershipJob structure', () => {
  test('file exists', () => {
    expect(existsSync(jobPath)).toBe(true)
  })

  test('imports IndexerService', () => {
    expect(jobSource).toContain("from '../Services/IndexerService'")
  })

  test('imports TransactionListenerService', () => {
    expect(jobSource).toContain("from '../Services/TransactionListenerService'")
  })

  test('exports runSyncOwnershipJob function', () => {
    expect(jobSource).toContain('export async function runSyncOwnershipJob')
  })

  test('exports startSyncOwnershipSchedule function', () => {
    expect(jobSource).toContain('export function startSyncOwnershipSchedule')
  })
})

describe('SyncOwnershipJob function signatures', () => {
  test('runSyncOwnershipJob accepts db parameter', () => {
    expect(jobSource).toContain('runSyncOwnershipJob(db: any)')
  })

  test('runSyncOwnershipJob returns result shape', () => {
    expect(jobSource).toContain('collectionsProcessed: number')
    expect(jobSource).toContain('changesDetected: number')
    expect(jobSource).toContain('errors: string[]')
  })

  test('startSyncOwnershipSchedule accepts db and interval', () => {
    expect(jobSource).toContain('startSyncOwnershipSchedule(')
    expect(jobSource).toContain('intervalMs: number')
  })

  test('startSyncOwnershipSchedule returns cleanup function', () => {
    expect(jobSource).toContain('() => void')
    expect(jobSource).toContain('clearInterval(timer)')
  })
})

describe('SyncOwnershipJob implementation', () => {
  test('iterates over all collections', () => {
    expect(jobSource).toContain('for (const collection of collections)')
  })

  test('calls syncSingleCollectionOwnership for each collection', () => {
    expect(jobSource).toContain('indexerService.syncSingleCollectionOwnership')
  })

  test('handles errors per collection without stopping', () => {
    // Should catch errors for individual collections
    expect(jobSource).toContain('catch (err)')
    expect(jobSource).toContain('errors.push(')
  })

  test('returns error details in result', () => {
    expect(jobSource).toContain('errors: [`Failed to fetch collections:')
  })

  test('logs progress', () => {
    expect(jobSource).toContain('console.log')
    expect(jobSource).toContain('ownership change(s) detected')
  })

  test('default poll interval is 30 seconds', () => {
    expect(jobSource).toContain('30_000')
  })

  test('uses setInterval for scheduling', () => {
    expect(jobSource).toContain('setInterval(')
  })
})

// ============================================
// Runtime tests
// ============================================

describe('SyncOwnershipJob runtime', () => {
  test('returns zero results when no collections exist', async () => {
    const { runSyncOwnershipJob } = await import('../../../app/Jobs/SyncOwnershipJob')

    const mockDb = {
      selectFrom() {
        return {
          selectAll() { return this },
          async execute() { return [] },
        }
      },
    }

    const result = await runSyncOwnershipJob(mockDb)
    expect(result.collectionsProcessed).toBe(0)
    expect(result.changesDetected).toBe(0)
    expect(result.errors.length).toBe(0)
  })

  test('returns error when DB fails', async () => {
    const { runSyncOwnershipJob } = await import('../../../app/Jobs/SyncOwnershipJob')

    const brokenDb = {
      selectFrom() {
        throw new Error('Connection refused')
      },
    }

    const result = await runSyncOwnershipJob(brokenDb)
    expect(result.collectionsProcessed).toBe(0)
    expect(result.errors.length).toBe(1)
    expect(result.errors[0]).toContain('Failed to fetch collections')
  })

  test('startSyncOwnershipSchedule returns cleanup function', async () => {
    const { startSyncOwnershipSchedule } = await import('../../../app/Jobs/SyncOwnershipJob')

    const mockDb = {
      selectFrom() {
        return {
          selectAll() { return this },
          async execute() { return [] },
        }
      },
    }

    const cleanup = startSyncOwnershipSchedule(mockDb, 60_000)
    expect(typeof cleanup).toBe('function')

    // Cleanup to prevent lingering intervals
    cleanup()
  })
})
