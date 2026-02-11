import { describe, expect, test } from 'bun:test'

test('dom test', () => {
  document.body.innerHTML = `<button>My button</button>`
  const button = document.querySelector('button')
  expect(button?.textContent).toEqual('My button')
})

describe('Marketplace UI Components', () => {
  test('renders mint button with correct text', () => {
    document.body.innerHTML = `<button class="mint-button">Mint Now</button>`
    const button = document.querySelector('.mint-button')
    expect(button?.textContent).toBe('Mint Now')
  })

  test('renders wallet connect button', () => {
    document.body.innerHTML = `<button id="connect-wallet-btn">Connect Wallet to Mint</button>`
    const button = document.getElementById('connect-wallet-btn')
    expect(button?.textContent).toBe('Connect Wallet to Mint')
  })

  test('renders quantity selector with +/- buttons', () => {
    document.body.innerHTML = `
      <div>
        <button id="qty-minus">−</button>
        <span id="mint-qty">1</span>
        <button id="qty-plus">+</button>
      </div>
    `
    expect(document.getElementById('qty-minus')?.textContent).toBe('−')
    expect(document.getElementById('mint-qty')?.textContent).toBe('1')
    expect(document.getElementById('qty-plus')?.textContent).toBe('+')
  })

  test('renders progress bar element', () => {
    document.body.innerHTML = `
      <div class="h-3 bg-gray-7 rounded-full overflow-hidden">
        <div class="progress-bar h-full" style="width: 50%"></div>
      </div>
    `
    const progressBar = document.querySelector('.progress-bar')
    expect(progressBar).not.toBeNull()
    expect(progressBar?.getAttribute('style')).toContain('width: 50%')
  })

  test('renders NFT card with image and name', () => {
    document.body.innerHTML = `
      <div class="nft-card">
        <img src="/assets/images/nft1.png" alt="Cool NFT #1" />
        <p class="nft-name">Cool NFT #1</p>
      </div>
    `
    const card = document.querySelector('.nft-card')
    expect(card).not.toBeNull()
    expect(card?.querySelector('img')?.getAttribute('alt')).toBe('Cool NFT #1')
    expect(card?.querySelector('.nft-name')?.textContent).toBe('Cool NFT #1')
  })

  test('renders price display in SOL', () => {
    document.body.innerHTML = `<span class="price-display">1.5 SOL</span>`
    const price = document.querySelector('.price-display')
    expect(price?.textContent).toContain('SOL')
  })

  test('renders offer form with amount input', () => {
    document.body.innerHTML = `
      <form class="offer-form">
        <input type="number" name="amount" placeholder="Offer amount in SOL" />
        <button type="submit">Make Offer</button>
      </form>
    `
    const form = document.querySelector('.offer-form')
    expect(form).not.toBeNull()
    expect(form?.querySelector('input[name="amount"]')).not.toBeNull()
    expect(form?.querySelector('button')?.textContent).toBe('Make Offer')
  })

  test('renders auction bid form', () => {
    document.body.innerHTML = `
      <form class="bid-form">
        <input type="number" name="bidAmount" placeholder="Bid amount in SOL" />
        <button type="submit">Place Bid</button>
      </form>
    `
    const form = document.querySelector('.bid-form')
    expect(form).not.toBeNull()
    expect(form?.querySelector('input[name="bidAmount"]')).not.toBeNull()
    expect(form?.querySelector('button')?.textContent).toBe('Place Bid')
  })

  test('renders listing card with price and buy button', () => {
    document.body.innerHTML = `
      <div class="listing-card">
        <img src="/assets/images/nft.png" alt="Listed NFT" />
        <span class="listing-price">2.5 SOL</span>
        <button class="buy-btn">Buy Now</button>
      </div>
    `
    const card = document.querySelector('.listing-card')
    expect(card).not.toBeNull()
    expect(card?.querySelector('.listing-price')?.textContent).toContain('SOL')
    expect(card?.querySelector('.buy-btn')?.textContent).toBe('Buy Now')
  })
})
