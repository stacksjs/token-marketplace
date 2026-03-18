import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const componentPath = join(process.cwd(), 'resources/views/components/MainLayout.stx')

describe('MainLayout Component', () => {
  test('component file exists', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  test('references Header component', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('Header')
  })

  test('references Footer component', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('Footer')
  })

  test('uses Header component', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('<Header />')
  })

  test('uses Footer component', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('<Footer />')
  })

  test('contains slot for page content', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('<slot />')
  })

  test('has main wrapper element', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('<main>')
    expect(content).toContain('</main>')
  })

  test('has min-height screen wrapper', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('min-h-screen')
  })
})
