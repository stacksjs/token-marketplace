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

  test('has static data for collections', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('const featuredCollections = [')
    expect(content).toContain('const popularCollections = [')
    expect(content).toContain('const availableNfts = [')
  })

  test('uses @foreach for collections', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('@foreach(featuredCollections')
    expect(content).toContain('@foreach(popularCollections')
    expect(content).toContain('@foreach(availableNfts')
  })

  test('uses correct field names for images', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('{{ collection.imageUrl }}')
    expect(content).toContain('{{ nft.imageUrl }}')
  })

  test('contains Explore collections button', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('Explore collections')
    expect(content).toContain('href="/collections"')
  })

  test('has custom gradient styles', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('.bg-hero-gradient')
    expect(content).toContain('.bg-cta-gradient')
  })

  test('contains sample collection data', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('Hoodratz')
    expect(content).toContain('Crypto Punks')
  })
})
