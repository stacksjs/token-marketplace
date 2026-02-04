import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const viewPath = join(process.cwd(), 'resources/views/collections.stx')

describe('Collections Page (collections.stx)', () => {
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
    expect(content).toContain('<title>All Collections | Naked NFTs')
  })

  test('links to stylesheet', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('href="/assets/css/styles.css"')
  })

  test('contains page heading', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('All Collections')
  })

  test('contains search bar', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('placeholder="Search Collections..."')
  })

  test('has collections data', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('export const collections')
  })

  test('uses @foreach for collections grid', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('@foreach(collections as collection)')
    expect(content).toContain('@endforeach')
  })

  test('collection cards link to detail pages', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('href="/collections/{{ collection.slug }}"')
  })

  test('uses @if for live indicator', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('@if(collection.isLive)')
    expect(content).toContain('@endif')
  })

  test('displays collection images', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('{{ collection.hero_image }}')
    expect(content).toContain('{{ collection.profile_image }}')
  })
})
