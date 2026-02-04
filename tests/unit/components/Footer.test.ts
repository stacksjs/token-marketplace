import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const componentPath = join(process.cwd(), 'resources/views/components/Footer.stx')

describe('Footer Component', () => {
  test('component file exists', () => {
    expect(existsSync(componentPath)).toBe(true)
  })

  test('contains footer links data', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('footerLinks')
    expect(content).toContain('collections')
    expect(content).toContain('tools')
    expect(content).toContain('social')
    expect(content).toContain('legal')
  })

  test('contains footer element', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('<footer')
    expect(content).toContain('</footer>')
  })

  test('contains logo with brand name', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('Naked')
    expect(content).toContain('/NFT')
  })

  test('contains social media links', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('Instagram')
    expect(content).toContain('Twitter')
    expect(content).toContain('Discord')
  })

  test('contains social media URLs', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('instagram.com/nakednfts')
    expect(content).toContain('twitter.com/nakednfts')
    expect(content).toContain('discord.gg/hoodies')
  })

  test('contains privacy policy link', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('Privacy Policy')
    expect(content).toContain('/privacy-policy')
  })

  test('contains copyright section', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('Naked NFTs')
    expect(content).toContain('siteInfo.year')
  })

  test('uses @foreach directive for link lists', () => {
    const content = readFileSync(componentPath, 'utf-8')
    expect(content).toContain('@foreach(footerLinks.collections')
    expect(content).toContain('@foreach(footerLinks.tools')
    expect(content).toContain('@foreach(footerLinks.social')
    expect(content).toContain('@endforeach')
  })
})
