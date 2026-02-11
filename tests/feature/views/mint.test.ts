import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const viewPath = join(process.cwd(), 'resources/views/collections/[slug]/mint.stx')

describe('Mint Page (collections/[slug]/mint.stx)', () => {
  test('view file exists', () => {
    expect(existsSync(viewPath)).toBe(true)
  })

  test('uses MainLayout wrapper', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('<MainLayout>')
    expect(content).toContain('</MainLayout>')
  })

  test('has correct page title containing "Mint"', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('<title>Mint')
  })

  test('contains progress bar element', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('progress-bar')
  })

  test('contains mint price display', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('mintPriceSol')
    expect(content).toContain('Mint Price')
  })

  test('contains wallet connection button', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('connect-wallet-btn')
    expect(content).toContain('Connect Wallet')
  })

  test('contains quantity selector', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('qty-minus')
    expect(content).toContain('qty-plus')
    expect(content).toContain('mint-qty')
  })

  test('contains mint button', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('mint-btn')
    expect(content).toContain('mint-button')
  })

  test('shows presale info section', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('Presale')
    expect(content).toContain('activePresales')
  })

  test('shows candy machine address', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('candyMachineAddress')
    expect(content).toContain('Candy Machine')
  })

  test('displays recently minted NFTs grid', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('Recently Minted')
    expect(content).toContain('mintedNfts')
  })

  test('handles wallet connection (Phantom, Solflare)', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('phantom')
    expect(content).toContain('solflare')
  })

  test('shows transaction success state', () => {
    const content = readFileSync(viewPath, 'utf-8')
    expect(content).toContain('mint-success')
    expect(content).toContain('Mint Successful')
  })
})
