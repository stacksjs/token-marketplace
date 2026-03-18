/**
 * Test Factories
 *
 * Mock data generators for marketplace entities.
 * Used across unit, feature, and integration tests.
 */
import { randomUUID } from 'crypto'

const RARITY_LEVELS = ['Common', 'Uncommon', 'Rare', 'Legendary'] as const

function randomAddress(prefix = 'Fake'): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let result = prefix
  while (result.length < 44) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result.slice(0, 44)
}

function randomTxSignature(): string {
  return randomAddress('Tx')
}

export function createMockCollection(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    name: `Test Collection ${Math.floor(Math.random() * 1000)}`,
    slug: `test-collection-${Math.floor(Math.random() * 1000)}`,
    description: 'A test NFT collection',
    image_url: 'https://arweave.net/fake-collection-image',
    banner_url: 'https://arweave.net/fake-collection-banner',
    collection_address: randomAddress('Col'),
    creator_address: randomAddress('Creator'),
    symbol: 'TST',
    seller_fee_basis_points: 500,
    total_items: 10000,
    minted_items: 5000,
    floor_price: 1_500_000_000, // 1.5 SOL in lamports
    total_volume: 50_000_000_000_000, // 50,000 SOL
    listed_count: 342,
    owners_count: 2847,
    is_live: true,
    is_featured: false,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockNFT(overrides?: Record<string, unknown>) {
  const rarityIndex = Math.floor(Math.random() * 4)
  return {
    id: randomUUID(),
    mint_address: randomAddress('Mint'),
    name: `Hoodie #${Math.floor(Math.random() * 10000)}`,
    symbol: 'HDR',
    image_url: 'https://arweave.net/fake-nft-image',
    metadata_uri: 'https://arweave.net/fake-metadata-uri',
    collection_id: overrides?.collection_id ?? randomUUID(),
    rarity_rank: Math.floor(Math.random() * 10000) + 1,
    rarity_level: RARITY_LEVELS[rarityIndex],
    listing_price: null as number | null,
    listed_at: null as string | null,
    delegate_address: null as string | null,
    listing_id: null as string | null,
    owner_wallet: randomAddress('Owner'),
    attributes: JSON.stringify([
      { trait_type: 'Background', value: 'Purple' },
      { trait_type: 'Hat', value: 'Crown' },
      { trait_type: 'Eyes', value: 'Laser' },
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockListedNFT(overrides?: Record<string, unknown>) {
  return createMockNFT({
    listing_price: 2_000_000_000, // 2 SOL
    listed_at: new Date().toISOString(),
    delegate_address: randomAddress('Delegate'),
    listing_id: randomUUID(),
    ...overrides,
  })
}

export function createMockOffer(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    nft_id: overrides?.nft_id ?? randomUUID(),
    offerer_wallet: randomAddress('Offerer'),
    amount: 1_000_000_000, // 1 SOL in lamports
    currency: 'SOL',
    status: 'active' as 'active' | 'accepted' | 'cancelled' | 'expired' | 'rejected',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tx_signature: randomTxSignature(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockAuction(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    nft_id: overrides?.nft_id ?? randomUUID(),
    seller_wallet: randomAddress('Seller'),
    type: 'english' as 'english' | 'dutch',
    start_price: 1_000_000_000,
    reserve_price: null as number | null,
    current_price: 1_500_000_000,
    min_bid_increment: 100_000_000, // 0.1 SOL
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    anti_snipe_minutes: 5,
    price_curve: 'linear' as 'linear' | 'exponential',
    status: 'active' as 'active' | 'ended' | 'settled' | 'cancelled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockBid(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    auction_id: overrides?.auction_id ?? randomUUID(),
    bidder_wallet: randomAddress('Bidder'),
    amount: 1_500_000_000,
    tx_signature: randomTxSignature(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockMarketplaceEvent(overrides?: Record<string, unknown>) {
  const types = ['sale', 'listing', 'delisting', 'offer', 'transfer', 'bid', 'auction_settled'] as const
  return {
    id: randomUUID(),
    type: types[Math.floor(Math.random() * types.length)],
    nft_id: overrides?.nft_id ?? randomUUID(),
    collection_id: overrides?.collection_id ?? randomUUID(),
    from_wallet: randomAddress('From'),
    to_wallet: randomAddress('To'),
    price: 1_500_000_000,
    currency: 'SOL',
    tx_signature: randomTxSignature(),
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockStakingPool(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    collection_id: overrides?.collection_id ?? randomUUID(),
    reward_mint: randomAddress('Reward'),
    reward_rate: 100,
    lock_period_seconds: 86400, // 1 day
    total_staked: 150,
    total_rewards_distributed: 5_000_000_000,
    pool_address: randomAddress('Pool'),
    status: 'active' as 'active' | 'paused' | 'ended',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockStake(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    pool_id: overrides?.pool_id ?? randomUUID(),
    nft_mint: randomAddress('Mint'),
    staker_wallet: randomAddress('Staker'),
    staked_at: new Date().toISOString(),
    unlocks_at: new Date(Date.now() + 86400 * 1000).toISOString(),
    claimed_rewards: 0,
    status: 'staked' as 'staked' | 'unstaked',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockProposal(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    dao_id: overrides?.dao_id ?? randomUUID(),
    title: 'Increase platform fee to 2%',
    description: 'Proposal to increase the platform fee from 1% to 2% to fund development.',
    proposer_wallet: randomAddress('Proposer'),
    options: JSON.stringify(['Yes', 'No', 'Abstain']),
    status: 'active' as 'pending' | 'active' | 'passed' | 'rejected' | 'executed',
    voting_starts_at: new Date().toISOString(),
    voting_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockVote(overrides?: Record<string, unknown>) {
  return {
    id: randomUUID(),
    proposal_id: overrides?.proposal_id ?? randomUUID(),
    voter_wallet: randomAddress('Voter'),
    nft_mint: randomAddress('Mint'),
    option_index: 0,
    tx_signature: randomTxSignature(),
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createMockWallet(): string {
  return randomAddress('Wallet')
}

export { randomAddress, randomTxSignature }
