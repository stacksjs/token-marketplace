import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const viewPath = join(process.cwd(), 'resources/views/collections/[slug].stx')

describe('Collection Detail Page (collections/[slug].stx)', () => {
  test('view file exists', () => {
    expect(existsSync(viewPath)).toBe(true)
  })

  test('uses MainLayout wrapper', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('<MainLayout>')
    expect(content).toContain('</MainLayout>')
  })

  test('contains collection header with name', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('{{ collection.name }}')
  })

  test('displays collection image', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('collection.image_url')
  })

  test('shows minting status indicator', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('is_minting')
    expect(content).toContain('Minting Live')
  })

  test('shows stats (total items, floor price, volume, owners)', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('total_amount_of_nfts')
    expect(content).toContain('floor_price')
    expect(content).toContain('volume_traded')
    expect(content).toContain('unique_holders')
  })

  test('has "Mint Now" button linking to mint page', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('Mint Now')
    expect(content).toContain('/mint')
  })

  test('displays NFTs grid', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('@foreach(nfts as nft)')
    expect(content).toContain('nft.image_url')
  })

  test('shows rarity rank on NFT cards', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('rarity_rank')
  })

  test('has social links section', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('collection.website')
    expect(content).toContain('collection.twitter')
    expect(content).toContain('collection.discord')
  })

  test('handles error states', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('@if(error)')
    expect(content).toContain('Browse all collections')
  })
})
