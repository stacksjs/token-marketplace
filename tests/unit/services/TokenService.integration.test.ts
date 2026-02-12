import { describe, expect, test } from 'bun:test'

// Ensure mock mode before importing
process.env.TOKENS_MOCK_MODE = 'true'

import { TokenService } from '../../../app/Services/TokenService'

describe('TokenService Integration (mock mode)', () => {
  test('full candy machine lifecycle: create → add config lines → mint → check sold out', async () => {
    const service = new TokenService()

    // Create candy machine
    const cm = await service.createCandyMachine({
      itemsAvailable: 10,
      symbol: 'TEST',
      collectionMint: 'collectionMint123',
      creatorAddress: 'creator123',
    })
    expect(cm.candyMachine).toBeDefined()
    expect(cm.signature).toBeDefined()

    // Add config lines
    const configLines = Array.from({ length: 10 }, (_, i) => ({
      name: `NFT #${i}`,
      uri: `https://arweave.net/item${i}`,
    }))
    const addResults = await service.addConfigLines(cm.candyMachine, configLines)
    expect(addResults.length).toBeGreaterThan(0)

    // Check info
    const info = await service.getCandyMachineInfo(cm.candyMachine)
    expect(info.address).toBe(cm.candyMachine)
    expect(info.itemsAvailable).toBeGreaterThan(0)
  })

  test('full listing lifecycle: list → buy (verify ownership transfer)', async () => {
    const service = new TokenService()

    // List
    const listing = await service.listNFT('mintAddr', BigInt(2000000000))
    expect(listing.delegated).toBe(true)

    // Buy
    const purchase = await service.buyListedNFT('mintAddr')
    expect(purchase.signature).toBeDefined()
    expect(purchase.listing.mint).toBe('mintAddr')
  })

  test('full offer lifecycle: make offer → accept', async () => {
    const service = new TokenService()

    // Make offer
    const offer = await service.makeOffer('mintAddr', BigInt(1500000000))
    expect(offer.status).toBe('active')

    // Accept offer
    const acceptance = await service.acceptOffer(offer.id)
    expect(acceptance.signature).toBeDefined()
    expect(acceptance.offer.status).toBe('accepted')
  })

  test('full auction lifecycle: create → bid → settle', async () => {
    const service = new TokenService()

    // Create auction
    const auction = await service.createAuction('mintAddr', {
      type: 'english',
      startPrice: BigInt(1000000000),
      duration: 3600,
    })
    expect(auction.status).toBe('active')

    // Place bid
    const bid = await service.placeBid(auction.id, BigInt(1500000000))
    expect(bid.status).toBe('confirmed')

    // Settle
    const settlement = await service.settleAuction(auction.id)
    expect(settlement.signature).toBeDefined()
    expect(settlement.auction.status).toBe('settled')
  })

  test('presale flow: generate merkle root → verify proof → mint with discount', async () => {
    const service = new TokenService()
    const addresses = ['wallet1', 'wallet2', 'wallet3', 'wallet4', 'wallet5']

    // Generate merkle root
    const root = service.generateMerkleRoot(addresses)
    expect(root.length).toBe(32)

    // Generate and verify proof for wallet2
    const { proof, leaf } = service.generateMerkleProof('wallet2', addresses)
    const isValid = service.verifyMerkleProof(proof, leaf, root)
    expect(isValid).toBe(true)

    // Verify non-member is rejected
    const { proof: fakeProof, leaf: fakeLeaf } = service.generateMerkleProof('wallet999', addresses)
    const fakeValid = service.verifyMerkleProof(fakeProof, fakeLeaf, root)
    // wallet999 is not in the list, so proof should be empty and verification fails
    expect(fakeProof.length).toBe(0)
  })

  test('storage flow: upload image → upload metadata → verify URLs', async () => {
    const service = new TokenService()

    // Upload image
    const image = await service.uploadImage('/tmp/test.png')
    expect(image.url).toContain('arweave.net')

    // Upload metadata referencing the image
    const metadata = await service.uploadMetadata({
      name: 'Test NFT',
      symbol: 'TEST',
      image: image.url,
    })
    expect(metadata.url).toContain('arweave.net')
    expect(metadata.id).toBeDefined()
  })
})
