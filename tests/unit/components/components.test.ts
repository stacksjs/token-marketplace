/**
 * STX Component Tests
 *
 * Verifies all frontend component and view files exist with correct structure.
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'

// ============================================
// Layout
// ============================================

describe('Default layout', () => {
  const path = 'resources/layouts/default.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('contains yield for page content', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('@yield')
  })
})

// ============================================
// Core Components
// ============================================

describe('Header component', () => {
  const path = 'resources/views/components/Header.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('contains navigation elements', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source.toLowerCase()).toContain('nav')
  })
})

describe('Footer component', () => {
  const path = 'resources/views/components/Footer.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('contains footer structure', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source.toLowerCase()).toContain('footer')
  })
})

describe('Toast component', () => {
  const path = 'resources/views/components/Toast.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('handles notification display', () => {
    const source = readFileSync(path, 'utf-8')
    // Should have some kind of message or notification content
    expect(source.length).toBeGreaterThan(0)
  })
})

describe('AuthModal component', () => {
  const path = 'resources/views/components/AuthModal.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('contains wallet connection UI', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source.toLowerCase()).toContain('wallet')
  })
})

describe('Drawer component', () => {
  const path = 'resources/views/components/Drawer.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })
})

describe('MainLayout component', () => {
  const path = 'resources/views/components/MainLayout.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('includes Header and Footer', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source).toContain('Header')
    expect(source).toContain('Footer')
  })
})

// ============================================
// Page Views
// ============================================

describe('Home page (index)', () => {
  const path = 'resources/views/index.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })
})

describe('Collections index page', () => {
  const path = 'resources/views/collections/index.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('displays collection listings', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source.toLowerCase()).toContain('collection')
  })
})

describe('Collection detail page', () => {
  const path = 'resources/views/collections/[slug].stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })
})

describe('Collection mint page', () => {
  const path = 'resources/views/collections/[slug]/mint.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('contains mint functionality', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source.toLowerCase()).toContain('mint')
  })
})

describe('Profile page', () => {
  const path = 'resources/views/profile.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })

  test('contains wallet-related content', () => {
    const source = readFileSync(path, 'utf-8')
    expect(source.toLowerCase()).toContain('wallet')
  })
})

describe('Admin page', () => {
  const path = 'resources/views/admin.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })
})

describe('Rarity index page', () => {
  const path = 'resources/views/rarity/index.stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })
})

describe('Rarity detail page', () => {
  const path = 'resources/views/rarity/[slug].stx'

  test('file exists', () => {
    expect(existsSync(path)).toBe(true)
  })
})

// ============================================
// Component inventory
// ============================================

describe('Component inventory', () => {
  const expectedComponents = [
    'resources/views/components/Header.stx',
    'resources/views/components/Footer.stx',
    'resources/views/components/Toast.stx',
    'resources/views/components/AuthModal.stx',
    'resources/views/components/Drawer.stx',
    'resources/views/components/MainLayout.stx',
  ]

  for (const component of expectedComponents) {
    test(`${component} exists`, () => {
      expect(existsSync(component)).toBe(true)
    })
  }
})

describe('View inventory', () => {
  const expectedViews = [
    'resources/views/index.stx',
    'resources/views/profile.stx',
    'resources/views/admin.stx',
    'resources/views/collections/index.stx',
    'resources/views/collections/[slug].stx',
    'resources/views/collections/[slug]/mint.stx',
    'resources/views/rarity/index.stx',
    'resources/views/rarity/[slug].stx',
  ]

  for (const view of expectedViews) {
    test(`${view} exists`, () => {
      expect(existsSync(view)).toBe(true)
    })
  }
})
