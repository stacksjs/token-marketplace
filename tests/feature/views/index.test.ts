import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const viewPath = join(process.cwd(), 'resources/views/index.stx')

describe('Home Page (index.stx)', () => {
  test('view file exists', () => {
    expect(existsSync(viewPath)).toBe(true)
  })

  test('imports MainLayout component', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain("import MainLayout from './components/MainLayout.stx'")
  })

  test('uses MainLayout wrapper', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('<MainLayout>')
    expect(content).toContain('</MainLayout>')
  })

  test('has correct page title', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('<title>Home | Naked NFTs')
  })

  test('links to stylesheet', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('href="/assets/css/styles.css"')
  })

  test('contains hero section', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('id="hero"')
  })

  test('contains featured collections section', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('id="featured-collections"')
    expect(content).toContain('Featured Collections')
  })

  test('contains popular collections section', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('id="popular-collections"')
    expect(content).toContain('Popular Collections')
  })

  test('contains available NFTs section', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('id="available-items"')
    expect(content).toContain('Available NFTs')
  })

  test('contains CTA section', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('id="create-nft"')
  })

  test('has featured collections data', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('featuredCollections')
  })

  test('has popular collections data', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('popularCollections')
  })

  test('uses @foreach for collections', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('@foreach(featuredCollections')
    expect(content).toContain('@foreach(popularCollections')
  })

  test('contains Explore collections button', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('Explore collections')
    expect(content).toContain('href="/collections"')
  })
})
