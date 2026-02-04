import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const componentPath = join(process.cwd(), 'resources/views/components/Header.stx')

describe('Header Component', () => {
  test('component file exists', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  test('contains navigation links data', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('navLinks')
    expect(content).toContain('Home')
    expect(content).toContain('Explore')
    expect(content).toContain('Rarity')
    expect(content).toContain('Staking')
    expect(content).toContain('Grassroots')
  })

  test('contains header element', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('<header>')
    expect(content).toContain('</header>')
  })

  test('contains navigation element', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('<nav')
    expect(content).toContain('</nav>')
  })

  test('contains logo with brand name', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('Naked')
    expect(content).toContain('/NFT')
  })

  test('contains Connect Wallet button', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('Connect Wallet')
  })

  test('uses @foreach directive for navigation', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('@foreach(navLinks')
    expect(content).toContain('@endforeach')
  })

  test('contains correct route paths', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('href: "/"')
    expect(content).toContain('href: "/collections"')
    expect(content).toContain('href: "/rarity"')
  })
})
