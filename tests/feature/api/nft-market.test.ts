import { describe, expect, test } from 'bun:test'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const actionsPath = join(process.cwd(), 'app/Actions/Nft')

describe('NFT Secondary Market API Actions', () => {
  describe('ListNftAction', () => {
    const actionPath = join(actionsPath, 'ListNftAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'List NFT'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates required fields', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('nftId')
      expect(content).toContain('price')
      expect(content).toContain('sellerWalletAddress')
      expect(content).toContain('nftId, price, and sellerWalletAddress are required')
    })

    test('calls tokenService.listNFTForSale', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.listNFTForSale')
    })

    test('verifies NFT ownership before listing', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Only the owner can list an NFT for sale')
    })

    test('prevents listing already listed NFTs', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('NFT is already listed for sale')
    })

    test('validates price is non-negative', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('price must be a non-negative number')
    })
  })

  describe('BuyNftAction', () => {
    const actionPath = join(actionsPath, 'BuyNftAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Buy NFT'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates required fields', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('nftId')
      expect(content).toContain('buyerWalletAddress')
      expect(content).toContain('nftId and buyerWalletAddress are required')
    })

    test('calls tokenService.buyListedNFT', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.buyListedNFT')
    })

    test('handles royalties via getRoyaltyInfo', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('getRoyaltyInfo')
      expect(content).toContain('sellerFeeBasisPoints')
      expect(content).toContain('creators')
    })

    test('prevents buying own NFT', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Cannot buy your own NFT')
    })

    test('checks NFT is for sale', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('NFT is not for sale')
    })

    test('transfers ownership in database', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('owner_wallet_address: buyerWalletAddress')
    })
  })

  describe('DelistNftAction', () => {
    const actionPath = join(actionsPath, 'DelistNftAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Delist NFT'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('calls tokenService.delistNFT', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.delistNFT')
    })

    test('verifies ownership before delisting', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Only the owner can delist an NFT')
    })

    test('checks NFT is currently listed', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('NFT is not currently listed for sale')
    })

    test('clears listing fields in database', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('is_for_sale: 0')
      expect(content).toContain('listing_id: null')
      expect(content).toContain('delegate_address: null')
    })
  })

  describe('MakeOfferAction', () => {
    const actionPath = join(actionsPath, 'MakeOfferAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Make Offer'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates required fields', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('amount')
      expect(content).toContain('buyerWalletAddress')
      expect(content).toContain('nftId, amount, and buyerWalletAddress are required')
    })

    test('validates amount is positive', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('amount must be a positive number')
    })

    test('prevents offering on own NFT', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Cannot make an offer on your own NFT')
    })

    test('stores offer in database', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("insertInto('offers')")
      expect(content).toContain("status: 'pending'")
    })

    test('calls tokenService.makeOffer', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.makeOffer')
    })
  })

  describe('AcceptOfferAction', () => {
    const actionPath = join(actionsPath, 'AcceptOfferAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Accept Offer'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates required fields', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('offerId')
      expect(content).toContain('sellerWalletAddress')
      expect(content).toContain('offerId and sellerWalletAddress are required')
    })

    test('verifies seller owns the NFT', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Only the NFT owner can accept offers')
    })

    test('checks offer status is pending', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Cannot accept offer with status')
    })

    test('calls tokenService.acceptOffer', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.acceptOffer')
    })

    test('transfers NFT ownership on acceptance', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('owner_wallet_address: offer.buyer_wallet_address')
    })
  })

  describe('CancelOfferAction', () => {
    const actionPath = join(actionsPath, 'CancelOfferAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Cancel Offer'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates required fields', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('offerId')
      expect(content).toContain('buyerWalletAddress')
      expect(content).toContain('offerId and buyerWalletAddress are required')
    })

    test('only allows offer maker to cancel', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Only the offer maker can cancel the offer')
    })

    test('checks offer status is pending', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Cannot cancel offer with status')
    })

    test('calls tokenService.cancelOffer', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.cancelOffer')
    })

    test('updates offer status to cancelled', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("status: 'cancelled'")
    })
  })

  describe('CreateAuctionAction', () => {
    const actionPath = join(actionsPath, 'CreateAuctionAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Create Auction'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates required fields', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('nftId')
      expect(content).toContain('sellerWalletAddress')
      expect(content).toContain('startingPrice')
      expect(content).toContain('duration')
      expect(content).toContain('nftId, sellerWalletAddress, startingPrice, and duration are required')
    })

    test('supports english and dutch auction types', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('english')
      expect(content).toContain('dutch')
    })

    test('verifies NFT ownership', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Only the NFT owner can create an auction')
    })

    test('prevents auction if already listed', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('NFT is already listed for sale')
    })

    test('calls tokenService.createAuction', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.createAuction')
    })

    test('stores auction in database', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("insertInto('auctions')")
      expect(content).toContain("status: 'active'")
    })
  })

  describe('PlaceBidAction', () => {
    const actionPath = join(actionsPath, 'PlaceBidAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Place Bid'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates required fields', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('auctionId')
      expect(content).toContain('amount')
      expect(content).toContain('bidderWalletAddress')
      expect(content).toContain('auctionId, amount, and bidderWalletAddress are required')
    })

    test('validates amount is positive', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('amount must be a positive number')
    })

    test('prevents bidding on own auction', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Cannot bid on your own auction')
    })

    test('checks bid is higher than current highest', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Bid must be higher than current highest bid')
    })

    test('checks auction is active', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Cannot bid on auction with status')
    })

    test('calls tokenService.placeBid', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.placeBid')
    })

    test('stores bid in database', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("insertInto('bids')")
    })
  })

  describe('SettleAuctionAction', () => {
    const actionPath = join(actionsPath, 'SettleAuctionAction.ts')

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('has correct action name', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("name: 'Settle Auction'")
    })

    test('uses POST method', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("method: 'POST'")
    })

    test('validates auctionId is required', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('auctionId')
      expect(content).toContain('auctionId is required')
    })

    test('checks auction status allows settling', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('Cannot settle auction with status')
    })

    test('requires at least one bid', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('No bids placed on this auction')
    })

    test('calls tokenService.settleAuction', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('tokenService.settleAuction')
    })

    test('transfers NFT ownership to winner', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain('owner_wallet_address: auction.highest_bidder_wallet')
    })

    test('updates auction status to settled', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("status: 'settled'")
    })

    test('marks winning bid', () => {
      const content = readFileSync(actionPath, 'utf-8')
      expect(content).toContain("status: 'won'")
    })
  })
})

describe('NFT Secondary Market API Routes', () => {
  const routesPath = join(process.cwd(), 'routes/api.ts')

  test('routes file exists', () => {
    expect(existsSync(routesPath)).toBe(true)
  })

  test('has buy NFT route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/nfts/buy', 'Actions/Nft/BuyNftAction')")
  })

  test('has list NFT route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/nfts/list', 'Actions/Nft/ListNftAction')")
  })

  test('has delist NFT route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/nfts/delist', 'Actions/Nft/DelistNftAction')")
  })

  test('has make offer route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/nfts/offer', 'Actions/Nft/MakeOfferAction')")
  })

  test('has accept offer route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/nfts/offer/accept', 'Actions/Nft/AcceptOfferAction')")
  })

  test('has cancel offer route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/nfts/offer/cancel', 'Actions/Nft/CancelOfferAction')")
  })

  test('has create auction route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/nfts/auction', 'Actions/Nft/CreateAuctionAction')")
  })

  test('has place bid route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/nfts/auction/bid', 'Actions/Nft/PlaceBidAction')")
  })

  test('has settle auction route', () => {
    const content = readFileSync(routesPath, 'utf-8')
    expect(content).toContain("route.post('/nfts/auction/settle', 'Actions/Nft/SettleAuctionAction')")
  })
})
