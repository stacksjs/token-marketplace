import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const viewPath = join(process.cwd(), 'resources/views/rarity.stx')

describe('Rarity Page (rarity.stx)', () => {
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
    expect(content).toContain('<title>Rarity | Naked NFTs')
  })

  test('links to stylesheet', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('href="/assets/css/styles.css"')
  })

  test('contains page heading', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain("What's Your Rarity?")
  })

  test('contains search input', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('placeholder="Search Collections..."')
  })

  test('has rarity collections data', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('export const rarityCollections')
  })

  test('uses @foreach for collections grid', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('@foreach(rarityCollections as collection)')
    expect(content).toContain('@endforeach')
  })

  test('collection cards link to rarity detail pages', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('href="/rarity/{{ collection.slug }}"')
  })

  test('displays collection symbol', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('{{ collection.symbol }}')
  })

  test('handles social links conditionally', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('@if(collection.twitter)')
    expect(content).toContain('@elseif(collection.discord)')
    expect(content).toContain('@elseif(collection.website)')
    expect(content).toContain('@endif')
  })

  test('contains sort dropdown', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('Relevant')
  })

  test('has main content area', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('<main')
    expect(content).toContain('</main>')
  })
})
