import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Static analysis: verify Fee actions and FeeSelector component
// ============================================

const actionPath = 'app/Actions/Fees/FeeEstimateAction.ts'
const actionSource = readFileSync(actionPath, 'utf-8')

describe('FeeEstimateAction file structure', () => {
  test('file exists', () => {
    expect(existsSync(actionPath)).toBe(true)
  })

  test('imports Action from stacksjs', () => {
    expect(actionSource).toContain("import { Action } from '@stacksjs/actions'")
  })

  test('imports priorityFeeService', () => {
    expect(actionSource).toContain('priorityFeeService')
  })

  test('exports Action with name', () => {
    expect(actionSource).toContain("name: 'Fee Estimate'")
  })

  test('is a GET method', () => {
    expect(actionSource).toContain("method: 'GET'")
  })

  test('has async handle method', () => {
    expect(actionSource).toContain('async handle(')
  })
})

describe('FeeEstimateAction response data', () => {
  test('returns three fee tiers', () => {
    expect(actionSource).toContain('economy: estimate.economy')
    expect(actionSource).toContain('standard: estimate.standard')
    expect(actionSource).toContain('fast: estimate.fast')
  })

  test('returns networkCongestion', () => {
    expect(actionSource).toContain('networkCongestion: estimate.networkCongestion')
  })

  test('returns estimatedTimes', () => {
    expect(actionSource).toContain('estimatedTimes: estimate.estimatedTimes')
  })

  test('returns display formatted values', () => {
    expect(actionSource).toContain('display:')
    expect(actionSource).toContain('priorityFeeService.formatFeeSol(estimate.economy)')
    expect(actionSource).toContain('priorityFeeService.formatFeeSol(estimate.standard)')
    expect(actionSource).toContain('priorityFeeService.formatFeeSol(estimate.fast)')
  })

  test('returns updatedAt timestamp', () => {
    expect(actionSource).toContain('updatedAt: estimate.updatedAt')
  })

  test('handles errors with 500 status', () => {
    expect(actionSource).toContain("'Failed to fetch fee estimates'")
    expect(actionSource).toContain('500')
  })
})

// ============================================
// Verify routes
// ============================================

const routesPath = 'routes/api.ts'
const routesSource = readFileSync(routesPath, 'utf-8')

describe('Fee routes', () => {
  test('fee estimate route exists', () => {
    expect(routesSource).toContain("route.get('/fees/estimate', 'Actions/Fees/FeeEstimateAction')")
  })
})

// ============================================
// FeeSelector component
// ============================================

const componentPath = 'resources/views/components/FeeSelector.stx'
const componentSource = readFileSync(componentPath, 'utf-8')

describe('FeeSelector component structure', () => {
  test('file exists', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  test('has fee-selector container', () => {
    expect(componentSource).toContain('class="fee-selector"')
    expect(componentSource).toContain('id="fee-selector"')
  })

  test('has congestion badge', () => {
    expect(componentSource).toContain('id="congestion-badge"')
  })
})

describe('FeeSelector fee tiers', () => {
  test('has economy tier', () => {
    expect(componentSource).toContain('data-tier="economy"')
    expect(componentSource).toContain('id="fee-economy"')
  })

  test('has standard tier (selected by default)', () => {
    expect(componentSource).toContain('data-tier="standard"')
    expect(componentSource).toContain('id="fee-standard"')
    expect(componentSource).toContain('checked')
  })

  test('has fast tier', () => {
    expect(componentSource).toContain('data-tier="fast"')
    expect(componentSource).toContain('id="fee-fast"')
  })

  test('has time estimate elements', () => {
    expect(componentSource).toContain('id="fee-time-economy"')
    expect(componentSource).toContain('id="fee-time-standard"')
    expect(componentSource).toContain('id="fee-time-fast"')
  })

  test('uses radio buttons for selection', () => {
    expect(componentSource).toContain('type="radio"')
    expect(componentSource).toContain('name="fee-tier"')
  })
})

describe('FeeSelector styles', () => {
  test('has congestion color styles', () => {
    expect(componentSource).toContain('.congestion-low')
    expect(componentSource).toContain('.congestion-medium')
    expect(componentSource).toContain('.congestion-high')
  })

  test('has selected state styling', () => {
    expect(componentSource).toContain('.fee-option.selected')
  })

  test('has hover transition', () => {
    expect(componentSource).toContain('transition:')
  })
})

describe('FeeSelector JavaScript', () => {
  test('fetches fee estimates from API', () => {
    expect(componentSource).toContain("fetch('/api/fees/estimate')")
  })

  test('updates DOM elements with fee data', () => {
    expect(componentSource).toContain("document.getElementById('fee-economy')")
    expect(componentSource).toContain("document.getElementById('fee-standard')")
    expect(componentSource).toContain("document.getElementById('fee-fast')")
  })

  test('updates congestion badge', () => {
    expect(componentSource).toContain("document.getElementById('congestion-badge')")
  })

  test('dispatches custom fee-selected event', () => {
    expect(componentSource).toContain("new CustomEvent('fee-selected'")
  })

  test('refreshes every 30 seconds', () => {
    expect(componentSource).toContain('setInterval(loadFeeEstimates, 30000)')
  })

  test('exposes window.FeeSelector API', () => {
    expect(componentSource).toContain('window.FeeSelector')
    expect(componentSource).toContain('getSelectedTier')
    expect(componentSource).toContain('refresh:')
    expect(componentSource).toContain('destroy:')
  })
})
