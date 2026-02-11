import { describe, expect, test, beforeAll } from 'bun:test'

// Ensure mock mode before importing
process.env.TOKENS_MOCK_MODE = 'true'

import { TokenService, createTokenService, getTokenService, resetTokenService } from '../../../app/Services/TokenService'

describe('TokenService', () => {
  describe('Constructor & Config', () => {
    test('creates instance in mock mode', () => {
      const service = new TokenService()
      expect(service).toBeInstanceOf(TokenService)
    })

    test('creates instance with custom config', () => {
      const service = new TokenService({ network: 'testnet' })
      expect(service).toBeInstanceOf(TokenService)
    })

    test('respects TOKENS_MOCK_MODE env variable', () => {
      // Service should not throw in mock mode
      const service = new TokenService()
      expect(() => service.getConnection()).toThrow('Cannot get connection in mock mode')
    })
  })

  describe('Candy Machine Operations (mock mode)', () => {
    test('createCandyMachine returns address + signature', async () => {
      const service = new TokenService()
      const result = await service.createCandyMachine({
        itemsAvailable: 100,
        symbol: 'TEST',
        collectionMint: 'testMint123',
        creatorAddress: 'creator123',
      })
      expect(result.candyMachine).toBeDefined()
      expect(result.candyMachine.length).toBe(44)
      expect(result.signature).toBeDefined()
      expect(result.signature.length).toBe(88)
      expect(result.collection).toBe('testMint123')
    })

    test('addConfigLines processes batches correctly', async () => {
      const service = new TokenService()
      const configLines = Array.from({ length: 25 }, (_, i) => ({
        name: `NFT #${i}`,
        uri: `https://arweave.net/item${i}`,
      }))
      const results = await service.addConfigLines('candyMachineAddr', configLines)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].signature).toBeDefined()
      expect(results[0].status).toBe('confirmed')
    })

    test('mintFromCandyMachine returns mint address', async () => {
      const service = new TokenService()
      const result = await service.mintFromCandyMachine('candyMachineAddr')
      expect(result.mint).toBeDefined()
      expect(result.mint.length).toBe(44)
      expect(result.signature).toBeDefined()
    })

    test('getCandyMachineOnChainInfo returns structured info', async () => {
      const service = new TokenService()
      const info = await service.getCandyMachineOnChainInfo('someAddress')
      expect(info.address).toBe('someAddress')
      expect(info.itemsAvailable).toBeGreaterThan(0)
      expect(info.itemsRedeemed).toBeDefined()
      expect(info.itemsRemaining).toBeDefined()
      expect(info.itemsRemaining).toBe(info.itemsAvailable - info.itemsRedeemed)
      expect(info.symbol).toBe('MOCK')
      expect(info.creators).toBeInstanceOf(Array)
      expect(info.configLineSettings).toBeDefined()
    })
  })

  describe('NFT Operations (mock mode)', () => {
    test('getNFTData returns full metadata', async () => {
      const service = new TokenService()
      const data = await service.getNFTData('mintAddr123')
      expect(data.mint).toBe('mintAddr123')
      expect(data.owner).toBeDefined()
      expect(data.metadata).toBeDefined()
      expect(data.metadata.symbol).toBe('MOCK')
      expect(data.offChainMetadata).toBeDefined()
      expect(data.offChainMetadata?.image).toContain('arweave.net')
    })

    test('transferNFT returns confirmed signature', async () => {
      const service = new TokenService()
      const result = await service.transferNFT('mintAddr', 'toAddr')
      expect(result.signature).toBeDefined()
      expect(result.signature.length).toBe(88)
      expect(result.status).toBe('confirmed')
    })

    test('getNFTsByOwner returns array of mints', async () => {
      const service = new TokenService()
      const mints = await service.getNFTsByOwner('walletAddr')
      expect(mints).toBeInstanceOf(Array)
      expect(mints.length).toBe(3)
      mints.forEach(m => expect(m.length).toBe(44))
    })

    test('getNFTsByCollection returns array of mints', async () => {
      const service = new TokenService()
      const mints = await service.getNFTsByCollection('collectionMint')
      expect(mints).toBeInstanceOf(Array)
      expect(mints.length).toBe(5)
    })
  })

  describe('Marketplace Operations (mock mode)', () => {
    test('listNFTForSale returns listing with delegate info', async () => {
      const service = new TokenService()
      const listing = await service.listNFTForSale('mintAddr', BigInt(1000000000))
      expect(listing.id).toBeDefined()
      expect(listing.mint).toBe('mintAddr')
      expect(listing.price).toBe(BigInt(1000000000))
      expect(listing.delegated).toBe(true)
      expect(listing.delegateAddress).toBeDefined()
      expect(listing.signature).toBeDefined()
    })

    test('delistNFT succeeds for valid mint', async () => {
      const service = new TokenService()
      const result = await service.delistNFT('mintAddr')
      expect(result.signature).toBeDefined()
      expect(result.status).toBe('confirmed')
    })

    test('buyListedNFT returns signature + listing', async () => {
      const service = new TokenService()
      const result = await service.buyListedNFT('mintAddr')
      expect(result.signature).toBeDefined()
      expect(result.listing).toBeDefined()
      expect(result.listing.mint).toBe('mintAddr')
      expect(result.listing.price).toBeDefined()
    })

    test('makeOffer returns offer record', async () => {
      const service = new TokenService()
      const offer = await service.makeOffer('mintAddr', BigInt(500000000))
      expect(offer.id).toBeDefined()
      expect(offer.mint).toBe('mintAddr')
      expect(offer.price).toBe(BigInt(500000000))
      expect(offer.status).toBe('active')
    })

    test('acceptOffer returns settlement signature', async () => {
      const service = new TokenService()
      const result = await service.acceptOffer('offerId123')
      expect(result.signature).toBeDefined()
      expect(result.offer).toBeDefined()
      expect(result.offer.status).toBe('accepted')
    })

    test('createAuction returns auction ID', async () => {
      const service = new TokenService()
      const auction = await service.createAuction('mintAddr', {
        type: 'english',
        startPrice: BigInt(1000000000),
        duration: 3600,
      })
      expect(auction.id).toBeDefined()
      expect(auction.type).toBe('english')
      expect(auction.status).toBe('active')
      expect(auction.startPrice).toBe(BigInt(1000000000))
      expect(auction.endTime).toBeGreaterThan(auction.startTime)
    })

    test('placeBid returns bid confirmation', async () => {
      const service = new TokenService()
      const bid = await service.placeBid('auctionId', BigInt(2000000000))
      expect(bid.auctionId).toBe('auctionId')
      expect(bid.amount).toBe(BigInt(2000000000))
      expect(bid.status).toBe('confirmed')
      expect(bid.bidder).toBeDefined()
    })

    test('settleAuction returns settlement signature', async () => {
      const service = new TokenService()
      const result = await service.settleAuction('auctionId')
      expect(result.signature).toBeDefined()
      expect(result.auction).toBeDefined()
      expect(result.auction.status).toBe('settled')
    })
  })

  describe('Storage Operations (mock mode)', () => {
    test('uploadMetadata returns URL + provider', async () => {
      const service = new TokenService()
      const result = await service.uploadMetadata({
        name: 'Test NFT',
        symbol: 'TEST',
        image: 'https://example.com/image.png',
      })
      expect(result.id).toBeDefined()
      expect(result.url).toContain('arweave.net')
      expect(result.provider).toBeDefined()
    })

    test('uploadImage returns URL + provider', async () => {
      const service = new TokenService()
      const result = await service.uploadImage('/tmp/test.png')
      expect(result.id).toBeDefined()
      expect(result.url).toContain('arweave.net')
      expect(result.provider).toBeDefined()
    })

    test('uploadBatch handles success/failure array', async () => {
      const service = new TokenService()
      const result = await service.uploadBatch([
        { path: '/tmp/1.png' },
        { path: '/tmp/2.png' },
      ])
      expect(result.results).toBeInstanceOf(Array)
      expect(result.results.length).toBe(2)
      expect(result.failed).toBeInstanceOf(Array)
    })

    test('estimateStorageCost returns lamports', async () => {
      const service = new TokenService()
      const cost = await service.estimateStorageCost(10240) // 10KB
      expect(cost).toBeGreaterThan(BigInt(0))
    })
  })

  describe('Merkle Tree Operations', () => {
    test('generateMerkleRoot returns 32-byte hash', () => {
      const service = new TokenService()
      const addresses = ['addr1', 'addr2', 'addr3']
      const root = service.generateMerkleRoot(addresses)
      expect(root).toBeInstanceOf(Uint8Array)
      expect(root.length).toBe(32)
    })

    test('generateMerkleProof returns valid proof', () => {
      const service = new TokenService()
      const addresses = ['addr1', 'addr2', 'addr3', 'addr4']
      const { proof, leaf } = service.generateMerkleProof('addr2', addresses)
      expect(proof).toBeInstanceOf(Array)
      expect(proof.length).toBeGreaterThan(0)
      expect(leaf).toBeInstanceOf(Uint8Array)
      expect(leaf.length).toBe(32)
    })

    test('verifyMerkleProof validates correct proof', () => {
      const service = new TokenService()
      const addresses = ['addr1', 'addr2', 'addr3', 'addr4']
      const root = service.generateMerkleRoot(addresses)
      const { proof, leaf } = service.generateMerkleProof('addr2', addresses)
      const valid = service.verifyMerkleProof(proof, leaf, root)
      expect(valid).toBe(true)
    })

    test('verifyMerkleProof rejects invalid proof', () => {
      const service = new TokenService()
      const addresses = ['addr1', 'addr2', 'addr3', 'addr4']
      const root = service.generateMerkleRoot(addresses)
      const { proof } = service.generateMerkleProof('addr2', addresses)
      // Use a different leaf (not in the tree)
      const fakeLeaf = new Uint8Array(32).fill(42)
      const valid = service.verifyMerkleProof(proof, fakeLeaf, root)
      expect(valid).toBe(false)
    })
  })

  describe('Singleton Pattern', () => {
    test('getTokenService returns same instance', () => {
      resetTokenService()
      const a = getTokenService()
      const b = getTokenService()
      expect(a).toBe(b)
    })

    test('createTokenService returns new instance each time', () => {
      const a = createTokenService()
      const b = createTokenService()
      expect(a).not.toBe(b)
    })

    test('resetTokenService clears singleton', () => {
      const a = getTokenService()
      resetTokenService()
      const b = getTokenService()
      expect(a).not.toBe(b)
    })
  })
})
