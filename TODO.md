# Token Marketplace TODO

> A comprehensive task list for building a Tensor-like NFT marketplace on Solana, powered by the Stacks framework and `ts-tokens`.

## Table of Contents

- [Phase 1: Link ts-tokens & Upgrade TokenService](#phase-1-link-ts-tokens--upgrade-tokenservice)
- [Phase 2: Upgrade Candy Machine to Full On-Chain](#phase-2-upgrade-candy-machine-to-full-on-chain)
- [Phase 3: Upgrade Secondary Market to On-Chain](#phase-3-upgrade-secondary-market-to-on-chain)
- [Phase 4: Database Migrations](#phase-4-database-migrations)
- [Phase 5: Tests](#phase-5-tests)
- [Phase 6: View Updates](#phase-6-view-updates)
- [Phase 7: Collection Browsing & NFT Grid](#phase-7-collection-browsing--nft-grid)
- [Phase 8: NFT Detail Page](#phase-8-nft-detail-page)
- [Phase 9: Trading UX — Listings, Buying & Offers](#phase-9-trading-ux--listings-buying--offers)
- [Phase 10: Auctions](#phase-10-auctions)
- [Phase 11: Activity Feed & Analytics](#phase-11-activity-feed--analytics)
- [Phase 12: User Profile & Portfolio](#phase-12-user-profile--portfolio)
- [Phase 13: Search, Filters & Sorting](#phase-13-search-filters--sorting)
- [Phase 14: Staking & Rewards](#phase-14-staking--rewards)
- [Phase 15: Governance & DAO](#phase-15-governance--dao)
- [Phase 16: DeFi Integration](#phase-16-defi-integration)
- [Phase 17: Cross-Marketplace & Aggregation](#phase-17-cross-marketplace--aggregation)
- [Phase 18: Security Hardening](#phase-18-security-hardening)
- [Phase 19: Performance & Infrastructure](#phase-19-performance--infrastructure)
- [Phase 20: Mobile & Responsive Design](#phase-20-mobile--responsive-design)
- [Phase 21: Polish & Launch](#phase-21-polish--launch)
- [Phase 22: Testing & Quality Assurance](#phase-22-testing--quality-assurance)
- [Recommended Implementation Order](#recommended-implementation-order)

---

## Phase 1: Link ts-tokens & Upgrade TokenService

### 1.1 Dependency Setup

- [x] Add ts-tokens as dependency via `bun link`
- [x] Add ts-tokens to `package.json` dependencies
- [x] Import marketplace functions (`listNFT`, `delistNFT`, `buyListedNFT`, `makeOffer`, `acceptOffer`, etc.)
- [x] Import candy machine query functions (`getCandyMachineInfo`, `getLoadedItems`, `getMintedItems`)
- [x] Import guard functions (`addGuards`, `updateGuards`, `removeGuards`, `mintWithGuard`)
- [x] Import NFT creation functions (`createCollection`, `createNFT`)

### 1.2 TokenService Core Methods

- [x] Replace XOR-based sha256 with `Bun.CryptoHasher('sha256')`
- [x] Add `listNFTForSale()` method with mock mode
- [x] Add `delistNFT()` method with mock mode
- [x] Add `buyListedNFT()` method with mock mode
- [x] Add `makeOffer()` / `acceptOffer()` / `cancelOffer()` methods with mock mode
- [x] Add `createAuction()` / `placeBid()` / `settleAuction()` methods with mock mode
- [x] Add `getCandyMachineOnChainInfo()` method with mock mode
- [x] Add `createOnChainCollection()` method with mock mode
- [x] Add `getRoyaltyInfo()` method with mock mode
- [x] Add guard management methods (`addGuards`, `updateGuards`, `removeGuards`)

### 1.3 Configuration Updates

- [x] Update `config/tokens.ts` with marketplace config:

  ```ts
  marketplace: {
    defaultCurrency: 'SOL',
    enforceRoyalties: true,
    defaultRoyaltyBasisPoints: 500,     // 5%
    defaultListingExpiry: 0,             // no expiry
    defaultOfferExpiry: 7 * 24 * 60 * 60, // 7 days
    minAuctionDuration: 3600,            // 1 hour
    maxAuctionDuration: 30 * 24 * 3600,  // 30 days
    platformFee: {
      enabled: true,
      basisPoints: 100,                  // 1%
      walletAddress: '<treasury>',
    },
  }
  ```

- [x] Update `config/tokens.ts` with guard defaults

---

## Phase 2: Upgrade Candy Machine to Full On-Chain

### 2.1 On-Chain Candy Machine Sync

- [x] Upgrade `SyncCandyMachineAction` to use `getCandyMachineOnChainInfo()`
- [x] Upgrade `GetCandyMachineAction` to optionally fetch on-chain state

### 2.2 Guard Management

- [x] Create `ManageGuardsAction` (add/update/remove guards)

  ```ts
  // Add guards to candy machine
  await tokenService.addGuards(candyMachineAddress, {
    solPayment: { lamports: 1_000_000_000, destination: treasury },
    startDate: { date: new Date('2026-04-01') },
    mintLimit: { limit: 3 },
    allowList: { merkleRoot: computedRoot },
  })
  ```

### 2.3 Config Line Upload

- [x] Create `UploadConfigLinesAction` (JSON upload with batch processing)

---

## Phase 3: Upgrade Secondary Market to On-Chain

### 3.1 Listing & Buying

- [x] Upgrade `ListNftAction` to use `tokenService.listNFTForSale()` (delegate pattern)

  ```ts
  // Seller delegates NFT to marketplace PDA, records listing on-chain
  const listing = await tokenService.listNFTForSale({
    mint: nftMintAddress,
    price: 1.5, // SOL
    seller: walletAddress,
  })
  ```

- [x] Upgrade `BuyNftAction` to use `tokenService.buyListedNFT()` (atomic swap + royalties)
- [x] Create `DelistNftAction` (revoke delegate)

### 3.2 Offer System

- [x] Create `MakeOfferAction`
- [x] Create `AcceptOfferAction`
- [x] Create `CancelOfferAction`

### 3.3 Auction System

- [x] Create `CreateAuctionAction`
- [x] Create `PlaceBidAction`
- [x] Create `SettleAuctionAction`
- [x] Add all new routes to `routes/api.ts`

---

## Phase 4: Database Migrations

### 4.1 Secondary Market Tables

- [x] Create `offers` table migration:

  ```ts
  // Fields: id, nft_id, offerer_wallet, amount, currency, status,
  //         expires_at, created_at, updated_at
  ```

- [x] Create `auctions` table migration:

  ```ts
  // Fields: id, nft_id, seller_wallet, type (english|dutch),
  //         start_price, reserve_price, current_price,
  //         starts_at, ends_at, status, created_at, updated_at
  ```

- [x] Create `bids` table migration:

  ```ts
  // Fields: id, auction_id, bidder_wallet, amount,
  //         transaction_signature, created_at
  ```

- [x] Add listing fields to `nfts` table (`listing_id`, `delegate_address`, `listed_at`, `listing_price`)

---

## Phase 5: Tests

### 5.1 Service Tests

- [x] TokenService unit tests (mock mode)
- [x] TokenService integration tests (lifecycle flows)

### 5.2 API Route Tests

- [x] Candy machine API route tests
- [x] NFT secondary market API route tests
- [x] Mint/presale API route tests

### 5.3 View Tests

- [x] Mint page view tests
- [x] Collection detail view tests
- [x] UI DOM tests (marketplace components)

### 5.4 Migration Tests

- [x] Marketplace migration tests (offers, auctions, bids)

---

## Phase 6: View Updates

- [x] Add "Make Offer" button to collection detail NFT cards
- [x] Add candy machine guard info to mint page
- [x] Update todo file with phased checklist

### 6.1 Verification Steps

- [ ] `bun link ts-tokens` succeeds, imports resolve
- [ ] All TokenService methods work with `TOKENS_MOCK_MODE=true`
- [ ] `bun test` passes all existing + new tests
- [ ] `buddy dev` starts without import errors
- [ ] `buddy migrate` runs new migrations
- [ ] Hit each new endpoint with curl and verify responses
- [ ] With mock mode off, test candy machine create + mint on devnet

---

## Phase 7: Collection Browsing & NFT Grid

> **Goal**: Tensor-style collection page with a dense, scannable NFT grid, real-time stats bar, and tab navigation.

### 7.1 Collection Page Redesign

- [ ] Redesign `collections/[slug].stx` with Tensor-style layout:
  - [ ] Collection banner image (full-width, 200px height)
  - [ ] Collection avatar overlapping the banner
  - [ ] Stats row: floor price, listed count, total volume, owners, best offer, 24h change
  - [ ] Tab navigation: Items, Activity, Analytics
  - [ ] Verified badge for verified collections
  - [ ] Social links row (Twitter, Discord, website)

### 7.2 NFT Grid

- [ ] Build `NFTCard` component:

  ```ts
  // Card displays:
  // - NFT image (lazy-loaded, aspect-ratio: 1/1)
  // - NFT name + ID
  // - Listing price (if listed) or "Not Listed"
  // - Rarity badge (Common / Uncommon / Rare / Legendary)
  // - Last sale price
  // - Best offer amount
  // - Quick-action buttons (Buy / Make Offer)
  ```

- [ ] Implement grid layout (4 columns desktop, 2 columns tablet, 1 column mobile)
- [ ] Add list view toggle (compact table with columns: image, name, rarity, price, last sale, owner)
- [ ] Infinite scroll with cursor-based pagination
- [ ] Loading skeleton cards while fetching

### 7.3 Real-Time Stats

- [ ] Implement stats bar auto-refresh (poll every 30s or WebSocket)
- [ ] Floor price with 24h delta (green/red arrow)
- [ ] Listed count / total supply ratio
- [ ] Total volume in SOL with USD equivalent
- [ ] Unique owners count

### 7.4 API Endpoints

- [ ] Add `GET /marketplace/collections/{slug}/nfts` with query params:

  ```ts
  // Query params:
  // ?status=listed|unlisted|all
  // ?minPrice=0.5&maxPrice=10
  // ?rarity=legendary,rare
  // ?traits[Background]=Purple&traits[Hat]=Crown
  // ?sort=price_asc|price_desc|rarity|recent|name
  // ?cursor=<last_id>&limit=50
  ```

- [ ] Add `GET /marketplace/collections/{slug}/stats` for real-time stats
- [ ] Add `GET /marketplace/collections/{slug}/attributes` for trait aggregations:

  ```ts
  // Response:
  // { "Background": { "Purple": 342, "Blue": 1205, ... },
  //   "Hat": { "Crown": 50, "Beanie": 890, ... } }
  ```

---

## Phase 8: NFT Detail Page

> **Goal**: Comprehensive NFT page showing all relevant data — artwork, attributes, offers, activity, and buy/sell actions.

### 8.1 NFT Detail View

- [ ] Create `nfts/[id].stx` detail page
- [ ] Full-size NFT artwork with click-to-zoom modal
- [ ] NFT name, collection link, and token address (copyable)
- [ ] Current owner with link to profile
- [ ] Rarity rank badge (#42 / 10,000)

### 8.2 Price & Actions Section

- [ ] If listed: show price + "Buy Now" button + fee breakdown tooltip
- [ ] If unlisted: show "Make Offer" button
- [ ] If owned by viewer: show "List for Sale" / "Transfer" / "Burn" buttons
- [ ] Price history chart (line graph of past sales over time)
- [ ] Last sale price + date

### 8.3 Attributes Panel

- [ ] Grid of trait cards, each showing:

  ```ts
  // Trait type: "Background"
  // Trait value: "Cosmic Purple"
  // Rarity: "2.3% have this trait" (with progress bar)
  // Floor for this trait: 1.2 SOL
  ```

### 8.4 Offers Tab

- [ ] Table of active offers: offerer address, amount, expiry, status
- [ ] Accept / reject buttons (if owner)
- [ ] Cancel button (if offerer)
- [ ] Sort by amount (highest first)

### 8.5 Activity Tab

- [ ] Timeline of events: minted, listed, sold, transferred, delisted, offer made/accepted
- [ ] Each entry: event type icon, from/to addresses, price, timestamp, tx link

### 8.6 More From Collection

- [ ] Horizontal scrollable row of 8-10 NFTs from the same collection
- [ ] "View All" link to collection page

### 8.7 API Endpoints

- [ ] Add `GET /marketplace/nfts/{id}/history`:

  ```ts
  // Returns: [{ type: 'sale', from, to, price, timestamp, txSignature }, ...]
  ```

- [ ] Add `GET /marketplace/nfts/{id}/offers`:

  ```ts
  // Returns: [{ offerer, amount, expiresAt, status, createdAt }, ...]
  ```

- [ ] Add `GET /marketplace/nfts/{id}/traits`:

  ```ts
  // Returns: [{ type, value, rarityPct, floorPrice, count }, ...]
  ```

---

## Phase 9: Trading UX — Listings, Buying & Offers

> **Goal**: Fast, confident trading experience. One-click buys, batch operations, and real-time transaction feedback — like Tensor.

### 9.1 Listing Flow

- [ ] "List for Sale" modal:
  - [ ] Price input (SOL) with USD estimate
  - [ ] Fee breakdown: royalties (5%) + platform fee (1%) + you receive
  - [ ] Optional expiry date picker
  - [ ] "List" button → wallet signature → confirmation toast
- [ ] Batch listing: select multiple owned NFTs → set price for each → list all in one flow
- [ ] Edit listing price without delisting (update delegate price)
- [ ] Auto-delist on transfer (revoke delegate in transfer action)

### 9.2 Buying Flow

- [ ] One-click "Buy Now" with transaction preview:

  ```ts
  // Preview shows:
  // NFT price:       1.50 SOL
  // Royalties:       0.075 SOL (5%)
  // Platform fee:    0.015 SOL (1%)
  // Total:           1.59 SOL
  // Your balance:    4.23 SOL ✓
  ```

- [ ] Insufficient balance warning with current wallet balance
- [ ] Cart / multi-buy: add multiple listed NFTs → batch purchase in one transaction
- [ ] Use `ts-tokens/batch` for multi-buy with address lookup tables

### 9.3 Offer Flow

- [ ] "Make Offer" modal:
  - [ ] Offer amount input (SOL)
  - [ ] Expiry selector (1 day, 3 days, 7 days, 30 days, custom)
  - [ ] Funds are escrowed on offer creation
- [ ] Collection-wide offers:

  ```ts
  // Offer on ANY NFT in a collection matching criteria
  await tokenService.makeOffer({
    collection: collectionAddress,
    amount: 0.8,  // SOL
    expiresIn: 7 * 24 * 3600,
    traits: { rarity: 'Rare' }, // optional filter
  })
  ```

- [ ] Counter-offer support (reject with suggested price)
- [ ] Auto-expire offers via background job

### 9.4 Transaction Feedback

- [ ] Transaction status toast component:
  - [ ] Pending: spinner + "Waiting for wallet signature..."
  - [ ] Submitted: spinner + "Confirming transaction..."
  - [ ] Confirmed: checkmark + "Transaction confirmed" + explorer link
  - [ ] Failed: error icon + reason + "Retry" button
- [ ] Transaction retry on transient failures (blockhash expired, etc.)
- [ ] Recent transactions drawer (accessible from header icon)
- [ ] Persist recent tx history in localStorage

### 9.5 API Endpoints

- [ ] `POST /marketplace/nfts/batch-list` — batch listing:

  ```ts
  // Body: { items: [{ mint, price }], seller }
  // Returns: { transaction: '<base64>' } (unsigned, for wallet signing)
  ```

- [ ] `POST /marketplace/nfts/batch-buy` — batch purchase:

  ```ts
  // Body: { mints: ['ABC...', 'DEF...'], buyer }
  // Returns: { transaction: '<base64>', totalCost, fees }
  ```

- [ ] `POST /marketplace/offers/collection` — collection-wide offer
- [ ] `POST /marketplace/offers/counter` — counter-offer

---

## Phase 10: Auctions

> **Goal**: Full auction system supporting both English (highest bid wins) and Dutch (price decreases over time) formats.

### 10.1 English Auctions

- [ ] Create auction modal:
  - [ ] Starting price input
  - [ ] Reserve price (optional, auction fails if not met)
  - [ ] Duration selector (1h, 6h, 12h, 24h, 3d, 7d)
  - [ ] Minimum bid increment setting
- [ ] Live auction page:
  - [ ] Current highest bid + bidder
  - [ ] Countdown timer (h:m:s)
  - [ ] Bid history table (bidder, amount, time)
  - [ ] "Place Bid" button with minimum amount pre-filled
- [ ] Auto-settle via background job when auction ends
- [ ] Anti-sniping: extend by 5 minutes if bid placed in last 5 minutes

### 10.2 Dutch Auctions

- [ ] Create Dutch auction modal:
  - [ ] Starting price (high)
  - [ ] Ending price (floor)
  - [ ] Duration
  - [ ] Price decay curve (linear or exponential)
- [ ] Live page:
  - [ ] Current price (decreasing in real-time)
  - [ ] Price chart showing decay curve
  - [ ] "Buy at Current Price" button
- [ ] Instant settlement on buy using `buyDutchAuction()` from `ts-tokens`

### 10.3 Auction Queries

- [ ] `GET /marketplace/auctions/active` — all active auctions (paginated)
- [ ] `GET /marketplace/auctions/{id}` — auction detail with bid history
- [ ] `GET /marketplace/auctions/{id}/bids` — paginated bids
- [ ] `GET /marketplace/auctions/ended` — recently ended auctions (results)

### 10.4 Database

- [ ] Add `min_bid_increment` column to `auctions` table
- [ ] Add `reserve_price` column to `auctions` table
- [ ] Add `anti_snipe_minutes` column to `auctions` table
- [ ] Add `price_curve` column to `auctions` table (`linear` | `exponential`)
- [ ] Index `auctions` by `status` + `ends_at` for efficient queries

---

## Phase 11: Activity Feed & Analytics

> **Goal**: Real-time feed of marketplace events and collection-level analytics dashboards.

### 11.1 Activity Feed Page

- [ ] Create `activity.stx` global activity page
- [ ] Real-time event stream: sales, listings, delistings, offers, transfers, auction bids

  ```ts
  // Event shape:
  interface MarketplaceEvent {
    type: 'sale' | 'listing' | 'delisting' | 'offer' | 'transfer' | 'bid' | 'auction_settled'
    nft: { mint: string, name: string, image: string }
    collection: { slug: string, name: string }
    from: string       // wallet address
    to?: string        // wallet address (for sales/transfers)
    price?: number     // SOL
    timestamp: Date
    txSignature: string
  }
  ```

- [ ] Filter by event type (checkboxes)
- [ ] Filter by collection (dropdown)
- [ ] Infinite scroll with real-time prepend for new events

### 11.2 Collection Activity Tab

- [ ] Activity tab on collection page (reuse feed component)
- [ ] Scoped to collection, same filters as global feed

### 11.3 Analytics Dashboard

- [ ] Create analytics section on collection page (Analytics tab):
  - [ ] Floor price chart (line, 24h / 7d / 30d / all-time toggles)
  - [ ] Volume chart (bar chart, daily volume in SOL)
  - [ ] Listings count chart (line, how many listed over time)
  - [ ] Average sale price trend (line)
  - [ ] Sales count per day (bar)

### 11.4 Holder Analytics

- [ ] Holder distribution pie chart (top 10 holders + "others")
- [ ] Top holders leaderboard (wallet, count, % of supply)
- [ ] Unique owners count over time
- [ ] Concentration metrics (% held by top 1%, top 10%)

### 11.5 Volume & Sales Stats

- [ ] Stats cards: 24h volume, 7d volume, 30d volume, all-time volume
- [ ] Unique buyers / sellers counts (24h, 7d, 30d)
- [ ] Average sale price (24h, 7d, 30d)
- [ ] Sales count (24h, 7d, 30d)

### 11.6 Database

- [ ] Create `marketplace_events` table:

  ```ts
  // Fields: id, type, nft_id, collection_id, from_wallet, to_wallet,
  //         price, currency, tx_signature, created_at
  ```

- [ ] Index by `type`, `collection_id`, `created_at` for efficient queries
- [ ] Create `collection_stats_snapshots` table for historical stats:

  ```ts
  // Fields: id, collection_id, floor_price, listed_count, total_volume,
  //         owners_count, avg_price, sales_count, snapshot_at
  ```

- [ ] Background job: snapshot collection stats every hour

### 11.7 API Endpoints

- [ ] `GET /marketplace/activity` — global feed with filters + pagination:

  ```ts
  // ?type=sale,listing&collection=hoodies&cursor=<id>&limit=50
  ```

- [ ] `GET /marketplace/collections/{slug}/activity` — collection-scoped feed
- [ ] `GET /marketplace/collections/{slug}/analytics` — charts data:

  ```ts
  // ?period=24h|7d|30d|all
  // Returns: { floorHistory: [...], volumeHistory: [...], salesHistory: [...] }
  ```

- [ ] `GET /marketplace/collections/{slug}/holders` — holder stats:

  ```ts
  // Returns: { totalOwners, topHolders: [...], distribution: [...] }
  ```

---

## Phase 12: User Profile & Portfolio

> **Goal**: Tensor-style portfolio page — see owned NFTs, active listings, open offers, and unrealized P&L.

### 12.1 Profile Page Redesign

- [ ] Redesign `profile.stx` with tabs:
  - [ ] **Owned** — grid of NFTs owned by wallet (using `getNFTsByOwner()`)
  - [ ] **Listed** — currently listed NFTs with prices
  - [ ] **Offers Made** — outgoing offers (pending, accepted, expired)
  - [ ] **Offers Received** — incoming offers on owned NFTs
  - [ ] **Activity** — wallet transaction history
- [ ] Profile header: wallet address (truncated + copy), SOL balance, portfolio value
- [ ] View any wallet via `/profile/{walletAddress}`

### 12.2 Portfolio Value

- [ ] Portfolio value estimation:

  ```ts
  // portfolioValue = sum(ownedNFTs.map(nft => collectionFloorPrice))
  // Display: "Estimated Value: 45.2 SOL (~$6,780)"
  ```

- [ ] Unrealized P&L per NFT:

  ```ts
  // pnl = currentFloorPrice - purchasePrice
  // Display: "+0.5 SOL (+33%)" in green, or "-0.2 SOL (-10%)" in red
  ```

- [ ] Total portfolio P&L summary

### 12.3 Quick Actions

- [ ] From Owned tab: List, Transfer, Burn (per-NFT action buttons)
- [ ] From Listed tab: Edit Price, Delist
- [ ] From Offers Received tab: Accept, Reject
- [ ] From Offers Made tab: Cancel

### 12.4 Watchlist

- [ ] Favorite/watchlist collections (stored in localStorage, optionally in DB for logged-in users)
- [ ] Watchlist section on profile showing floor price alerts

### 12.5 API Endpoints

- [ ] `GET /marketplace/profile/{wallet}/portfolio`:

  ```ts
  // Returns: { ownedCount, listedCount, estimatedValue, totalPnl,
  //            nfts: [{ mint, name, image, collection, floorPrice, purchasePrice, pnl }] }
  ```

- [ ] `GET /marketplace/profile/{wallet}/offers`:

  ```ts
  // Returns: { made: [...], received: [...] }
  ```

- [ ] `GET /marketplace/profile/{wallet}/activity`:

  ```ts
  // Returns: [{ type, nft, price, timestamp, txSignature }]
  ```

---

## Phase 13: Search, Filters & Sorting

> **Goal**: Fast, composable filters that make it easy to find exactly the NFT you want — just like Tensor's filter panel.

### 13.1 Attribute Filter Sidebar

- [ ] Collapsible trait filter panel (left sidebar on desktop, drawer on mobile):
  - [ ] Trait type headers (Background, Hat, Eyes, etc.)
  - [ ] Trait value checkboxes with counts: `Purple (342)`, `Blue (1,205)`
  - [ ] Multi-select within a trait type (OR logic)
  - [ ] Multi-trait filtering (AND logic across types)
  - [ ] "Clear All" button

### 13.2 Status & Price Filters

- [ ] Listing status toggle: All / Listed / Unlisted / Has Offers / In Auction
- [ ] Price range slider (min/max SOL)
- [ ] Rarity level filter: Common / Uncommon / Rare / Legendary (checkboxes)
- [ ] Owner filter: owned by me (if wallet connected)

### 13.3 Sorting

- [ ] Sort dropdown:
  - [ ] Price: Low → High
  - [ ] Price: High → Low
  - [ ] Rarity: Rarest First
  - [ ] Rarity: Most Common First
  - [ ] Recently Listed
  - [ ] Recently Sold
  - [ ] Token ID (ascending)
  - [ ] Token ID (descending)

### 13.4 Search

- [ ] Search bar: search by NFT name or token ID
- [ ] Autocomplete suggestions as you type
- [ ] Global search in header: search across collections, NFTs, and wallets

### 13.5 URL State

- [ ] Persist all filter/sort state in URL query params:

  ```
  /collections/hoodies?status=listed&minPrice=1&maxPrice=5
    &rarity=rare,legendary&traits[Hat]=Crown&sort=price_asc&q=arnold
  ```

- [ ] Shareable filtered URLs
- [ ] Back/forward browser navigation updates filters

### 13.6 Performance

- [ ] Debounced filter application (300ms)
- [ ] Optimistic UI: show loading state in grid, keep filters interactive
- [ ] Cache attribute counts per collection (invalidate on new listing/sale)

---

## Phase 14: Staking & Rewards

> **Goal**: Allow holders to stake their NFTs in pools to earn token rewards. Powered by `ts-tokens/staking`.

### 14.1 TokenService Staking Methods

- [ ] Add staking methods to `TokenService` using `ts-tokens/staking`:

  ```ts
  // Pool management
  tokenService.createStakingPool(options)     // Uses ts-tokens staking.createPool()
  tokenService.fundStakingPool(pool, amount)  // Uses ts-tokens staking.fundPool()
  tokenService.getStakingPoolInfo(pool)       // Uses ts-tokens staking.poolStats()

  // User operations
  tokenService.stakeNFT(pool, mint)           // Uses ts-tokens staking.stake()
  tokenService.unstakeNFT(pool, mint)         // Uses ts-tokens staking.unstake()
  tokenService.claimRewards(pool)             // Uses ts-tokens staking.claimRewards()
  ```

### 14.2 Database

- [ ] Create `staking_pools` table:

  ```ts
  // Fields: id, collection_id, reward_mint, reward_rate,
  //         lock_period_seconds, total_staked, total_rewards_distributed,
  //         pool_address, status (active|paused|ended), created_at, updated_at
  ```

- [ ] Create `stakes` table:

  ```ts
  // Fields: id, pool_id, nft_mint, staker_wallet,
  //         staked_at, unlocks_at, claimed_rewards, status (staked|unstaked),
  //         created_at, updated_at
  ```

- [ ] Create `staking_rewards` table:

  ```ts
  // Fields: id, pool_id, staker_wallet, amount, reward_mint,
  //         tx_signature, claimed_at
  ```

### 14.3 Staking Page

- [ ] Create `staking.stx` page:
  - [ ] Available staking pools list (pool name, APY, total staked, lock period)
  - [ ] "Stake" button per owned NFT (opens confirmation modal)
  - [ ] "Unstake" button per staked NFT (with lock period countdown)
  - [ ] Pending rewards display with "Claim" button
  - [ ] Staking history table
- [ ] Show staked badge on NFT cards across the marketplace

### 14.4 Staking Actions

- [ ] Create `CreateStakingPoolAction`
- [ ] Create `StakeNFTAction`
- [ ] Create `UnstakeNFTAction`
- [ ] Create `ClaimStakingRewardsAction`
- [ ] Create `GetStakingPoolAction`

### 14.5 API Endpoints

- [ ] `POST /staking/pool` — create staking pool (admin)
- [ ] `POST /staking/stake` — stake NFT
- [ ] `POST /staking/unstake` — unstake NFT
- [ ] `POST /staking/claim` — claim rewards
- [ ] `GET /staking/pools` — list pools (with user's stake info if wallet connected)
- [ ] `GET /staking/pool/{id}` — pool detail
- [ ] `GET /staking/my-stakes` — user's active stakes + pending rewards

---

## Phase 15: Governance & DAO

> **Goal**: Community governance where Hoodie holders vote on proposals. Powered by `ts-governance`.

### 15.1 Governance Integration

- [ ] Add governance methods to `TokenService` using `ts-governance`:

  ```ts
  tokenService.createDAO(options)           // Uses ts-governance createDAO()
  tokenService.createProposal(options)      // Uses ts-governance createProposal()
  tokenService.castVote(proposal, option)   // Uses ts-governance castVote()
  tokenService.executeProposal(proposal)    // Uses ts-governance executeProposal()
  tokenService.getTreasuryInfo(dao)         // Uses ts-tokens/treasury
  ```

- [ ] NFT-based voting: 1 Hoodie = 1 vote using `nftVoting()` from `ts-governance`

### 15.2 Database

- [ ] Create `daos` table:

  ```ts
  // Fields: id, name, collection_id, dao_address, treasury_address,
  //         voting_period_seconds, quorum_pct, created_at
  ```

- [ ] Create `proposals` table:

  ```ts
  // Fields: id, dao_id, title, description, proposer_wallet,
  //         options (JSON array), status (pending|active|passed|rejected|executed),
  //         voting_starts_at, voting_ends_at, created_at, updated_at
  ```

- [ ] Create `votes` table:

  ```ts
  // Fields: id, proposal_id, voter_wallet, nft_mint (the NFT used to vote),
  //         option_index, tx_signature, created_at
  ```

- [ ] Create `treasury_transactions` table:

  ```ts
  // Fields: id, dao_id, type (deposit|withdrawal|distribution),
  //         amount, currency, recipient_wallet, proposal_id,
  //         tx_signature, created_at
  ```

### 15.3 Governance Page

- [ ] Create `governance.stx` page:
  - [ ] Active proposals list with voting progress bars
  - [ ] Past proposals with results
  - [ ] "Create Proposal" button (with minimum holding requirement)
  - [ ] Vote modal: select option → sign with wallet → confirmation
  - [ ] Treasury balance display
  - [ ] Treasury transaction history

### 15.4 API Endpoints

- [ ] `POST /governance/dao` — create DAO (admin)
- [ ] `POST /governance/proposals` — create proposal
- [ ] `GET /governance/proposals` — list proposals (active/past)
- [ ] `GET /governance/proposals/{id}` — proposal detail with vote tallies
- [ ] `POST /governance/vote` — cast vote
- [ ] `POST /governance/execute` — execute passed proposal
- [ ] `GET /governance/treasury` — treasury overview

---

## Phase 16: DeFi Integration

> **Goal**: Integrate DeFi primitives so users can swap tokens, access token-gated features, and use gas-efficient minting.

### 16.1 Jupiter Swap Widget

- [ ] Embed Jupiter swap integration using `ts-tokens/defi`:

  ```ts
  // Get quote
  const quote = await tokenService.getSwapQuote({
    inputMint: 'USDC',
    outputMint: 'SOL',
    amount: 10_000_000, // 10 USDC
  })

  // Execute swap
  const result = await tokenService.executeSwap(quote)
  ```

- [ ] Swap widget on marketplace: buy SOL to fund NFT purchases
- [ ] "Buy with USDC" option on NFT detail page (auto-swap + buy)

### 16.2 Token-Gated Access

- [ ] Gate exclusive features behind NFT ownership:
  - [ ] Exclusive collections (only visible to holders)
  - [ ] Early access to new mints
  - [ ] Reduced platform fees for holders
- [ ] Verify ownership via `getNFTsByOwner()` on page load

### 16.3 Compressed NFTs

- [ ] Support compressed NFT (cNFT) minting via `ts-tokens/compressed-token`:
  - [ ] 100-1000x cheaper minting for large collections
  - [ ] Merkle tree creation and management
  - [ ] cNFT display in collection grid (same UI as regular NFTs)

### 16.4 Solana Actions / Blinks

- [ ] Create shareable action URLs using `ts-tokens/actions`:

  ```ts
  // Mint action: share a URL that lets anyone mint
  const mintAction = await tokenService.createMintAction({
    candyMachine: cmAddress,
    label: 'Mint a Hoodie',
  })
  // → https://marketplace.com/actions/mint?cm=ABC...

  // Buy action: share a URL to buy a specific NFT
  const buyAction = await tokenService.createBuyAction({
    mint: nftMintAddress,
    price: 1.5,
  })
  ```

- [ ] Serve `actions.json` manifest at `/.well-known/actions.json`
- [ ] Blink-compatible endpoints for social sharing (Twitter, Discord unfurls)

### 16.5 API Endpoints

- [ ] `GET /defi/swap/quote` — Jupiter swap quote
- [ ] `POST /defi/swap/execute` — execute swap
- [ ] `POST /actions/mint` — Blink-compatible mint endpoint
- [ ] `POST /actions/buy` — Blink-compatible buy endpoint
- [ ] `GET /.well-known/actions.json` — actions manifest

---

## Phase 17: Cross-Marketplace & Aggregation

> **Goal**: List NFTs simultaneously on multiple marketplaces and aggregate listings for best-price discovery.

### 17.1 Cross-Listing

- [ ] Integrate cross-marketplace listing using `ts-tokens/marketplace`:

  ```ts
  await tokenService.crossListNFT({
    mint: nftMintAddress,
    price: 1.5,
    marketplaces: ['hoodies', 'magic-eden', 'tensor'],
  })
  ```

- [ ] Cancel all cross-listings in one action using `cancelCrossListings()`
- [ ] Show listing source badges on NFT cards (e.g., "Listed on Tensor", "Listed on Magic Eden")

### 17.2 Aggregated Listings

- [ ] Fetch external listings for collection NFTs
- [ ] Display best price across all marketplaces using `getBestPrice()`:

  ```ts
  // Shows: "Best price: 1.2 SOL on Tensor" vs "1.5 SOL on Hoodies"
  ```

- [ ] "Buy at Best Price" button redirects to cheapest marketplace

### 17.3 API Endpoints

- [ ] `POST /marketplace/nfts/cross-list` — list across marketplaces
- [ ] `DELETE /marketplace/nfts/cross-list` — cancel cross-listings
- [ ] `GET /marketplace/nfts/{id}/listings` — aggregated listings from all marketplaces

---

## Phase 18: Security Hardening

> **Goal**: Protect users and the platform from exploits, MEV, and royalty evasion.

### 18.1 Transaction Security

- [ ] Transaction simulation before execution using `simulateTransaction()` from `ts-tokens/debug`:

  ```ts
  const simulation = await tokenService.simulateTransaction(tx)
  if (simulation.err) {
    // Show error to user before they sign
    showError(`Transaction would fail: ${simulation.err}`)
  }
  ```

- [ ] MEV protection on trades using `ts-tokens/security`:
  - [ ] Priority fee optimization to avoid sandwich attacks
  - [ ] Jito bundle support for private transaction submission

### 18.2 Royalty Enforcement

- [ ] Royalty bypass detection using `detectRoyaltyBypass()` from `ts-tokens/marketplace`
- [ ] Verify royalty payment on every sale using `verifyRoyaltyPayment()`
- [ ] Generate compliance reports using `generateComplianceReport()`:

  ```ts
  const report = await tokenService.generateComplianceReport({
    collection: collectionAddress,
    period: '30d',
  })
  // Returns: { totalSales, royaltiesPaid, royaltiesEvaded, complianceRate }
  ```

### 18.3 Input Validation & Rate Limiting

- [ ] Wallet address validation on all inputs
- [ ] Rate limiting on sensitive endpoints:
  - [ ] Minting: 3 per wallet per minute
  - [ ] Offers: 10 per wallet per minute
  - [ ] Listings: 20 per wallet per minute
- [ ] CSRF protection on all POST endpoints
- [ ] Request body size limits (prevent oversized payloads)

### 18.4 Phishing & Fraud Detection

- [ ] Phishing detection on wallet interactions using `ts-tokens/security`
- [ ] Flag suspicious accounts (new wallets making large offers)
- [ ] Admin audit log for all privileged actions:

  ```ts
  // Log: { admin, action, target, params, timestamp, ipAddress }
  ```

### 18.5 Admin Security

- [ ] Admin-only endpoints require wallet signature + allowlist check
- [ ] Multi-sig required for treasury withdrawals
- [ ] Alert system for anomalous activity (unusual volume, price manipulation)

---

## Phase 19: Performance & Infrastructure

> **Goal**: Sub-second page loads, efficient RPC usage, and real-time updates.

### 19.1 RPC Optimization

- [ ] Batch RPC calls using address lookup tables (`ts-tokens/batch`):

  ```ts
  // Instead of 50 individual getAccountInfo calls:
  const accounts = await tokenService.batchGetAccounts(mints)
  ```

- [ ] RPC failover configuration (primary + fallback endpoints):

  ```ts
  rpc: {
    primary: 'https://mainnet.helius-rpc.com/?api-key=...',
    fallback: ['https://api.mainnet-beta.solana.com'],
    timeout: 30_000,
  }
  ```

- [ ] Request deduplication (don't fetch same account twice in parallel)

### 19.2 Caching

- [ ] Metadata caching layer with TTL:
  - [ ] NFT metadata: cache 1 hour (immutable after mint)
  - [ ] Collection stats: cache 30 seconds
  - [ ] Listings: cache 10 seconds
  - [ ] Floor price: cache 15 seconds
- [ ] Image CDN / optimization for NFT thumbnails:
  - [ ] Generate thumbnail sizes: 200px, 400px, 800px
  - [ ] WebP conversion
  - [ ] Lazy loading with blur placeholder

### 19.3 Real-Time Updates

- [ ] WebSocket support for live updates:
  - [ ] New listings / delistings in collection
  - [ ] New offers on viewed NFT
  - [ ] Auction bid updates
  - [ ] Floor price changes
  - [ ] Activity feed real-time prepend
- [ ] Fallback to polling (30s interval) if WebSocket unavailable

### 19.4 Background Jobs

- [ ] Background job queue for:
  - [ ] On-chain state syncing (new mints, transfers, metadata changes)
  - [ ] Collection stats snapshot (hourly)
  - [ ] Offer expiry processing
  - [ ] Auction settlement
  - [ ] Staking reward distribution
- [ ] Job retry with exponential backoff
- [ ] Dead letter queue for failed jobs

### 19.5 Database Performance

- [ ] Index audit for all high-traffic queries:
  - [ ] `nfts`: composite index on `(collection_id, listing_price, rarity_rank)`
  - [ ] `offers`: index on `(nft_id, status, expires_at)`
  - [ ] `auctions`: index on `(status, ends_at)`
  - [ ] `marketplace_events`: index on `(collection_id, type, created_at)`
- [ ] Query optimization: use `EXPLAIN ANALYZE` on slow queries
- [ ] Connection pooling configuration

---

## Phase 20: Mobile & Responsive Design

> **Goal**: First-class mobile experience with wallet deep linking and touch-optimized UI.

### 20.1 Responsive Layouts

- [ ] Collection page: stack stats vertically, 2-column NFT grid, collapsible filter drawer
- [ ] NFT detail: full-width image, stacked sections below
- [ ] Profile: tab navigation becomes horizontal scroll
- [ ] Activity feed: compact card layout
- [ ] Auction page: simplified bid interface

### 20.2 Mobile Wallet Integration

- [ ] Mobile wallet deep linking using `ts-tokens/wallets`:
  - [ ] Phantom mobile: `phantom://` deep links
  - [ ] Solflare mobile: `solflare://` deep links
  - [ ] Generic Solana Mobile wallet adapter
- [ ] QR code for desktop-to-mobile wallet connection

### 20.3 Touch Interactions

- [ ] Swipe-to-dismiss modals
- [ ] Pull-to-refresh on collection pages
- [ ] Long-press NFT card for quick actions (list, transfer, offer)
- [ ] Haptic feedback on transaction confirmation (where supported)

### 20.4 Performance

- [ ] Image lazy loading with intersection observer
- [ ] Skeleton screens for all loading states
- [ ] Reduce initial JS payload (code split per route)
- [ ] Service worker for offline-capable shell

---

## Phase 21: Polish & Launch

> **Goal**: Production-ready marketplace with polished UX, error handling, and deployment infrastructure.

### 21.1 Error Handling

- [ ] User-friendly error messages for all failure modes:
  - [ ] Wallet not connected → "Connect your wallet to continue"
  - [ ] Insufficient balance → "You need X more SOL" with current balance
  - [ ] Transaction failed → specific reason + retry button
  - [ ] NFT already sold → "This NFT was just purchased" with redirect
  - [ ] Network error → "Connection lost. Retrying..." with auto-retry
- [ ] Error boundary pages: 404, 500, wallet disconnected
- [ ] Sentry-style error tracking for production

### 21.2 Empty States

- [ ] No NFTs owned → "Start your collection" with link to browse
- [ ] No listings → "Be the first to list" with guide
- [ ] No offers → "No offers yet"
- [ ] No activity → "No activity for this collection yet"
- [ ] Search no results → "No NFTs match your filters" with clear filters button

### 21.3 Dark Mode

- [ ] Dark mode theme with CSS variables:

  ```css
  :root {
    --bg-primary: #f4f0fb;
    --text-primary: #1E2321;
    /* ... */
  }
  [data-theme="dark"] {
    --bg-primary: #0f0d15;
    --text-primary: #e8e6f0;
    /* ... */
  }
  ```

- [ ] Theme toggle in header (sun/moon icon)
- [ ] Persist preference in localStorage
- [ ] Respect `prefers-color-scheme` system setting

### 21.4 SEO & Social

- [ ] Meta tags for all pages (title, description, canonical URL)
- [ ] Open Graph images:
  - [ ] Collection pages: collection banner + name + stats
  - [ ] NFT pages: NFT image + name + price
  - [ ] Auto-generated OG images via serverless function
- [ ] Twitter Card meta tags
- [ ] Structured data (JSON-LD) for NFT listings
- [ ] Sitemap generation for collections and popular NFTs

### 21.5 Onboarding

- [ ] First-time user flow:
  1. Land on homepage → see featured collections
  2. Click collection → browse NFTs (no wallet required)
  3. Click "Buy" → prompt to connect wallet
  4. Wallet connected → complete purchase
- [ ] Tooltip hints on first visit ("Click to filter by traits", "Sort by price here")
- [ ] "What is an NFT?" help modal for new users

### 21.6 Branding & Assets

- [ ] Favicon (16px, 32px, 180px Apple touch icon)
- [ ] PWA manifest with app icon
- [ ] Consistent logo usage across all pages
- [ ] Loading spinner matches brand

### 21.7 Deployment

- [ ] Production RPC endpoint (Helius or QuickNode mainnet)
- [ ] Helius API key for DAS API + webhooks
- [ ] Environment variable audit:
  - [ ] `SOLANA_NETWORK=mainnet-beta`
  - [ ] `SOLANA_RPC_URL=<production RPC>`
  - [ ] `HELIUS_API_KEY=<production key>`
  - [ ] `TOKENS_MOCK_MODE=false`
  - [ ] `PLATFORM_FEE_WALLET=<treasury wallet>`
  - [ ] `ADMIN_WALLETS=<comma-separated admin wallets>`
- [ ] Database migration on production
- [ ] SSL certificate configuration
- [ ] CDN configuration for static assets
- [ ] Monitoring: uptime checks, error rates, RPC latency
- [ ] Load testing on devnet before mainnet launch

---

## Phase 22: Testing & Quality Assurance

> **Goal**: Comprehensive test coverage across all marketplace features — unit tests for services and actions, feature tests for API endpoints, view tests for UI, integration tests for end-to-end flows, and performance benchmarks. All tests use Bun test runner with `TOKENS_MOCK_MODE=true`.

### 22.1 Test Infrastructure & Utilities

#### Test Setup

- [ ] Extend `tests/setup.ts` with marketplace test helpers:

  ```ts
  import { describe, expect, test, beforeAll, afterAll, beforeEach } from 'bun:test'

  // Global test environment
  process.env.TOKENS_MOCK_MODE = 'true'
  process.env.SOLANA_NETWORK = 'devnet'
  ```

- [ ] Create `tests/helpers/` directory for shared utilities

#### Test Factories

- [ ] Create `tests/helpers/factories.ts` — mock data generators:

  ```ts
  export function createMockNFT(overrides?: Partial<NFT>) {
    return {
      id: randomUUID(),
      mint_address: `FakeMint${randomBytes(16).toString('hex')}`,
      name: `Hoodie #${Math.floor(Math.random() * 10000)}`,
      image_url: 'https://arweave.net/fake-image-hash',
      collection_id: overrides?.collection_id ?? 'default-collection-uuid',
      rarity_rank: Math.floor(Math.random() * 10000),
      rarity_level: ['Common', 'Uncommon', 'Rare', 'Legendary'][Math.floor(Math.random() * 4)],
      listing_price: null,
      listed_at: null,
      delegate_address: null,
      owner_wallet: `FakeWallet${randomBytes(16).toString('hex')}`,
      ...overrides,
    }
  }

  export function createMockCollection(overrides?: Partial<Collection>) { /* ... */ }
  export function createMockOffer(overrides?: Partial<Offer>) { /* ... */ }
  export function createMockAuction(overrides?: Partial<Auction>) { /* ... */ }
  export function createMockBid(overrides?: Partial<Bid>) { /* ... */ }
  export function createMockStakingPool(overrides?: Partial<StakingPool>) { /* ... */ }
  export function createMockProposal(overrides?: Partial<Proposal>) { /* ... */ }
  export function createMockMarketplaceEvent(overrides?: Partial<MarketplaceEvent>) { /* ... */ }
  export function createMockWallet(): string { /* ... */ }
  ```

#### API Test Helpers

- [ ] Create `tests/helpers/api.ts` — HTTP request helpers:

  ```ts
  export async function apiGet(path: string, params?: Record<string, string>) {
    const url = new URL(`http://localhost:3000/api${path}`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return fetch(url.toString())
  }

  export async function apiPost(path: string, body: Record<string, unknown>) {
    return fetch(`http://localhost:3000/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  export async function authenticatedPost(path: string, body: Record<string, unknown>, wallet: string) {
    // Simulates wallet-authenticated request
  }
  ```

#### Mock TokenService

- [ ] Create `tests/helpers/mock-token-service.ts` — controlled mock for testing:

  ```ts
  export function createMockTokenService(overrides?: Partial<TokenService>) {
    return {
      listNFTForSale: async () => ({ listing_id: 'mock-listing', tx: 'mock-tx-sig' }),
      buyListedNFT: async () => ({ tx: 'mock-tx-sig', success: true }),
      makeOffer: async () => ({ offer_id: 'mock-offer', tx: 'mock-tx-sig' }),
      createAuction: async () => ({ auction_id: 'mock-auction', tx: 'mock-tx-sig' }),
      simulateTransaction: async () => ({ err: null, logs: [] }),
      ...overrides,
    }
  }
  ```

#### DOM Test Helpers

- [ ] Create `tests/helpers/dom.ts` — view rendering utilities:

  ```ts
  export function renderHTML(html: string) {
    document.body.innerHTML = html
    return document.body
  }

  export function querySelector<T extends Element>(selector: string): T | null {
    return document.querySelector<T>(selector)
  }

  export function querySelectorAll<T extends Element>(selector: string): T[] {
    return Array.from(document.querySelectorAll<T>(selector))
  }
  ```

---

### 22.2 TokenService Unit Tests

#### Existing Methods (Verify Phase 1-3 Coverage)

- [x] `createCandyMachine()` — mock mode returns candy machine address
- [x] `addConfigLines()` — mock mode processes batch items
- [x] `getCandyMachineInfo()` — mock mode returns CM details
- [x] `listNFTForSale()` — mock mode returns listing ID + tx signature
- [x] `delistNFT()` — mock mode revokes delegate
- [x] `buyListedNFT()` — mock mode returns purchase tx
- [x] `makeOffer()` / `acceptOffer()` / `cancelOffer()` — mock mode lifecycle
- [x] `createAuction()` / `placeBid()` / `settleAuction()` — mock mode lifecycle
- [x] `getRoyaltyInfo()` — mock mode returns royalty config

#### New Methods (Phase 7-21)

- [ ] Create `tests/unit/services/TokenService.staking.test.ts`:

  ```ts
  describe('TokenService Staking (mock mode)', () => {
    let service: TokenService

    beforeAll(() => {
      process.env.TOKENS_MOCK_MODE = 'true'
      service = new TokenService()
    })

    test('createStakingPool returns pool address', async () => {
      const pool = await service.createStakingPool({
        collection: 'FakeCollection...',
        rewardMint: 'FakeRewardMint...',
        rewardRate: 100,
        lockPeriod: 86400,
      })
      expect(pool.poolAddress).toBeDefined()
      expect(pool.tx).toBeDefined()
    })

    test('stakeNFT returns stake record', async () => {
      const result = await service.stakeNFT({ pool: 'FakePool...', mint: 'FakeMint...' })
      expect(result.stakeId).toBeDefined()
      expect(result.unlocksAt).toBeInstanceOf(Date)
    })

    test('unstakeNFT before lock period throws', async () => {
      expect(async () => {
        await service.unstakeNFT({ pool: 'FakePool...', mint: 'FakeMint...' })
      }).toThrow('Lock period has not expired')
    })

    test('claimRewards returns reward amount', async () => {
      const result = await service.claimRewards({ pool: 'FakePool...' })
      expect(result.amount).toBeGreaterThan(0)
      expect(result.tx).toBeDefined()
    })
  })
  ```

- [ ] Create `tests/unit/services/TokenService.governance.test.ts`:
  - [ ] `createDAO()` — returns DAO address
  - [ ] `createProposal()` — returns proposal ID
  - [ ] `castVote()` — validates NFT ownership, records vote
  - [ ] `executeProposal()` — only executes if quorum met + passed
  - [ ] `getTreasuryInfo()` — returns balance and transaction history

- [ ] Create `tests/unit/services/TokenService.defi.test.ts`:
  - [ ] `getSwapQuote()` — returns quote with input/output amounts
  - [ ] `executeSwap()` — returns tx signature
  - [ ] `createMintAction()` — returns valid action URL
  - [ ] `createBuyAction()` — returns valid action URL

- [ ] Create `tests/unit/services/TokenService.crossmarket.test.ts`:
  - [ ] `crossListNFT()` — returns listing IDs per marketplace
  - [ ] `cancelCrossListings()` — cancels all marketplace listings
  - [ ] `getBestPrice()` — returns lowest price across marketplaces

- [ ] Create `tests/unit/services/TokenService.security.test.ts`:
  - [ ] `simulateTransaction()` — returns simulation result without executing
  - [ ] `detectRoyaltyBypass()` — detects missing royalty payments
  - [ ] `generateComplianceReport()` — returns report with stats

---

### 22.3 Action Unit Tests

#### Collection & NFT Grid Actions (Phase 7)

- [ ] Create `tests/unit/actions/collection-nfts.test.ts`:

  ```ts
  describe('Collection NFTs Action', () => {
    const actionPath = 'app/Actions/Marketplace/CollectionNftsAction.ts'

    test('action file exists', () => {
      expect(existsSync(actionPath)).toBe(true)
    })

    test('supports pagination query params', () => {
      const source = readFileSync(actionPath, 'utf-8')
      expect(source).toContain('cursor')
      expect(source).toContain('limit')
    })

    test('supports filter params (status, minPrice, maxPrice, rarity, traits)', () => {
      const source = readFileSync(actionPath, 'utf-8')
      expect(source).toContain('status')
      expect(source).toContain('minPrice')
      expect(source).toContain('maxPrice')
      expect(source).toContain('rarity')
      expect(source).toContain('traits')
    })

    test('supports sort param', () => {
      const source = readFileSync(actionPath, 'utf-8')
      expect(source).toContain('sort')
      expect(source).toContain('price_asc')
      expect(source).toContain('price_desc')
    })
  })
  ```

- [ ] Create `tests/unit/actions/collection-stats.test.ts`:
  - [ ] Action file exists
  - [ ] Returns floor price, listed count, volume, owners, best offer
  - [ ] Stats are numeric and non-negative

- [ ] Create `tests/unit/actions/collection-attributes.test.ts`:
  - [ ] Action file exists
  - [ ] Returns trait types with value counts
  - [ ] Counts are positive integers

#### NFT Detail Actions (Phase 8)

- [ ] Create `tests/unit/actions/nft-history.test.ts`:
  - [ ] Action file exists
  - [ ] Returns array of events with type, from, to, price, timestamp
  - [ ] Events sorted by timestamp descending

- [ ] Create `tests/unit/actions/nft-offers.test.ts`:
  - [ ] Action file exists
  - [ ] Returns offers with offerer, amount, expiry, status
  - [ ] Filters by active status

- [ ] Create `tests/unit/actions/nft-traits.test.ts`:
  - [ ] Action file exists
  - [ ] Returns traits with rarity percentage and floor price

#### Trading Actions (Phase 9)

- [ ] Create `tests/unit/actions/batch-list.test.ts`:
  - [ ] Action file exists
  - [ ] Accepts array of `{ mint, price }` items
  - [ ] Returns unsigned transaction

- [ ] Create `tests/unit/actions/batch-buy.test.ts`:
  - [ ] Action file exists
  - [ ] Accepts array of mint addresses
  - [ ] Returns unsigned transaction with total cost + fee breakdown

- [ ] Create `tests/unit/actions/collection-offer.test.ts`:
  - [ ] Action file exists
  - [ ] Accepts collection address + amount + optional trait filter
  - [ ] Returns offer ID

- [ ] Create `tests/unit/actions/counter-offer.test.ts`:
  - [ ] Action file exists
  - [ ] Rejects original offer and creates new one with suggested price

#### Auction Actions (Phase 10)

- [ ] Create `tests/unit/actions/auction-detail.test.ts`:
  - [ ] `CreateAuctionAction` validates min/max duration
  - [ ] `CreateAuctionAction` validates reserve price ≤ start price (English)
  - [ ] `CreateAuctionAction` validates start price > end price (Dutch)

- [ ] Create `tests/unit/actions/bid-validation.test.ts`:
  - [ ] `PlaceBidAction` rejects bid below minimum increment
  - [ ] `PlaceBidAction` rejects bid after auction ended
  - [ ] `PlaceBidAction` rejects bid below current highest

- [ ] Create `tests/unit/actions/auction-settlement.test.ts`:
  - [ ] `SettleAuctionAction` transfers NFT to highest bidder (English)
  - [ ] `SettleAuctionAction` refunds losing bidders
  - [ ] `SettleAuctionAction` fails if auction still active

#### Activity Actions (Phase 11)

- [ ] Create `tests/unit/actions/activity-feed.test.ts`:
  - [ ] Action file exists
  - [ ] Supports type filter (sale, listing, offer, transfer, bid)
  - [ ] Supports collection filter
  - [ ] Returns paginated events sorted by timestamp descending

- [ ] Create `tests/unit/actions/analytics.test.ts`:
  - [ ] Action file exists
  - [ ] Returns floor history, volume history, sales history arrays
  - [ ] Supports period param (24h, 7d, 30d, all)
  - [ ] Each data point has timestamp + value

- [ ] Create `tests/unit/actions/holders.test.ts`:
  - [ ] Returns totalOwners count
  - [ ] Returns topHolders array sorted by count descending
  - [ ] Returns distribution data

#### Profile Actions (Phase 12)

- [ ] Create `tests/unit/actions/portfolio.test.ts`:
  - [ ] Returns owned count, listed count, estimated value
  - [ ] Estimated value = sum of floor prices for owned NFTs
  - [ ] P&L calculation: `floorPrice - purchasePrice` per NFT

- [ ] Create `tests/unit/actions/profile-offers.test.ts`:
  - [ ] Returns `made` array (offers this wallet made)
  - [ ] Returns `received` array (offers on this wallet's NFTs)
  - [ ] Separates by status (pending, accepted, expired, cancelled)

#### Staking Actions (Phase 14)

- [ ] Create `tests/unit/actions/staking.test.ts`:
  - [ ] `CreateStakingPoolAction` validates required fields (collection, reward mint, rate)
  - [ ] `StakeNFTAction` validates NFT ownership
  - [ ] `StakeNFTAction` rejects already-staked NFTs
  - [ ] `UnstakeNFTAction` validates lock period expiry
  - [ ] `ClaimStakingRewardsAction` calculates correct reward amount

#### Governance Actions (Phase 15)

- [ ] Create `tests/unit/actions/governance.test.ts`:
  - [ ] `CreateProposalAction` validates proposer holds NFT from collection
  - [ ] `CastVoteAction` validates NFT not already used to vote on same proposal
  - [ ] `CastVoteAction` validates proposal is in active voting period
  - [ ] `ExecuteProposalAction` validates quorum met + proposal passed
  - [ ] `ExecuteProposalAction` rejects execution of failed proposals

#### Security Actions (Phase 18)

- [ ] Create `tests/unit/actions/security.test.ts`:
  - [ ] Transaction simulation returns error before signing if tx would fail
  - [ ] Royalty bypass detection flags sales without royalty payments
  - [ ] Rate limiting rejects excessive requests per wallet
  - [ ] Admin audit log records privileged actions

---

### 22.4 API Feature Tests

> Feature tests hit API endpoints and verify request/response behavior.

#### Collection Endpoints (Phase 7)

- [ ] Create `tests/feature/api/collection-browse.test.ts`:

  ```ts
  describe('GET /marketplace/collections/{slug}/nfts', () => {
    test('returns paginated NFTs for collection', async () => {
      const res = await apiGet('/marketplace/collections/hoodies/nfts', { limit: '20' })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data).toBeInstanceOf(Array)
      expect(body.data.length).toBeLessThanOrEqual(20)
      expect(body.cursor).toBeDefined()
    })

    test('filters by listing status', async () => {
      const res = await apiGet('/marketplace/collections/hoodies/nfts', { status: 'listed' })
      const body = await res.json()
      body.data.forEach((nft: any) => {
        expect(nft.listing_price).not.toBeNull()
      })
    })

    test('filters by price range', async () => {
      const res = await apiGet('/marketplace/collections/hoodies/nfts', {
        minPrice: '1', maxPrice: '5',
      })
      const body = await res.json()
      body.data.forEach((nft: any) => {
        expect(nft.listing_price).toBeGreaterThanOrEqual(1)
        expect(nft.listing_price).toBeLessThanOrEqual(5)
      })
    })

    test('sorts by price ascending', async () => {
      const res = await apiGet('/marketplace/collections/hoodies/nfts', { sort: 'price_asc' })
      const body = await res.json()
      for (let i = 1; i < body.data.length; i++) {
        expect(body.data[i].listing_price).toBeGreaterThanOrEqual(body.data[i - 1].listing_price)
      }
    })

    test('filters by traits', async () => {
      const res = await apiGet('/marketplace/collections/hoodies/nfts', {
        'traits[Background]': 'Purple',
      })
      expect(res.status).toBe(200)
    })

    test('returns 404 for unknown collection', async () => {
      const res = await apiGet('/marketplace/collections/nonexistent/nfts')
      expect(res.status).toBe(404)
    })
  })
  ```

- [ ] Create `tests/feature/api/collection-stats.test.ts`:
  - [ ] `GET /marketplace/collections/{slug}/stats` returns 200 with numeric fields
  - [ ] Floor price is minimum listing price or null if no listings

- [ ] Create `tests/feature/api/collection-attributes.test.ts`:
  - [ ] `GET /marketplace/collections/{slug}/attributes` returns trait type → value → count mapping
  - [ ] Counts sum to total collection size per trait type

#### NFT Detail Endpoints (Phase 8)

- [ ] Create `tests/feature/api/nft-detail.test.ts`:
  - [ ] `GET /marketplace/nfts/{id}` returns full NFT data with metadata
  - [ ] `GET /marketplace/nfts/{id}/history` returns sorted activity events
  - [ ] `GET /marketplace/nfts/{id}/offers` returns active offers only
  - [ ] `GET /marketplace/nfts/{id}/traits` returns traits with rarity percentages
  - [ ] Returns 404 for unknown NFT ID

#### Trading Endpoints (Phase 9)

- [ ] Create `tests/feature/api/trading.test.ts`:

  ```ts
  describe('Trading Endpoints', () => {
    test('POST /marketplace/nfts/batch-list builds unsigned transaction', async () => {
      const res = await authenticatedPost('/marketplace/nfts/batch-list', {
        items: [
          { mint: 'FakeMint1...', price: 1.5 },
          { mint: 'FakeMint2...', price: 2.0 },
        ],
        seller: 'FakeWallet...',
      }, 'FakeWallet...')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.transaction).toBeDefined() // base64 encoded
    })

    test('POST /marketplace/nfts/batch-buy builds transaction with fee breakdown', async () => {
      const res = await authenticatedPost('/marketplace/nfts/batch-buy', {
        mints: ['FakeMint1...', 'FakeMint2...'],
        buyer: 'FakeWallet...',
      }, 'FakeWallet...')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.totalCost).toBeGreaterThan(0)
      expect(body.fees).toBeDefined()
      expect(body.fees.royalties).toBeGreaterThanOrEqual(0)
      expect(body.fees.platform).toBeGreaterThanOrEqual(0)
    })

    test('POST /marketplace/offers/collection creates collection-wide offer', async () => {
      const res = await authenticatedPost('/marketplace/offers/collection', {
        collection: 'hoodies',
        amount: 0.8,
        expiresIn: 604800, // 7 days
      }, 'FakeWallet...')
      expect(res.status).toBe(200)
    })
  })
  ```

#### Auction Endpoints (Phase 10)

- [ ] Create `tests/feature/api/auctions.test.ts`:
  - [ ] `POST /nfts/auction` creates English auction with valid params
  - [ ] `POST /nfts/auction` creates Dutch auction with start > end price
  - [ ] `POST /nfts/auction` rejects duration below minimum (1 hour)
  - [ ] `POST /nfts/auction` rejects duration above maximum (30 days)
  - [ ] `POST /nfts/auction/bid` rejects bid below minimum increment
  - [ ] `POST /nfts/auction/bid` rejects bid on ended auction
  - [ ] `POST /nfts/auction/settle` settles ended auction
  - [ ] `POST /nfts/auction/cancel` only allows seller to cancel
  - [ ] `GET /marketplace/auctions/active` returns paginated active auctions
  - [ ] `GET /marketplace/auctions/{id}` returns auction with bid history

#### Activity & Analytics Endpoints (Phase 11)

- [ ] Create `tests/feature/api/activity.test.ts`:
  - [ ] `GET /marketplace/activity` returns paginated events
  - [ ] `GET /marketplace/activity?type=sale` filters by type
  - [ ] `GET /marketplace/activity?collection=hoodies` filters by collection
  - [ ] `GET /marketplace/collections/{slug}/activity` scoped to collection
  - [ ] `GET /marketplace/collections/{slug}/analytics?period=7d` returns chart data
  - [ ] `GET /marketplace/collections/{slug}/holders` returns holder stats

#### Profile Endpoints (Phase 12)

- [ ] Create `tests/feature/api/profile.test.ts`:
  - [ ] `GET /marketplace/profile/{wallet}/portfolio` returns owned NFTs with values
  - [ ] `GET /marketplace/profile/{wallet}/offers` returns made + received offers
  - [ ] `GET /marketplace/profile/{wallet}/activity` returns wallet activity
  - [ ] Returns empty arrays for wallet with no activity

#### Staking Endpoints (Phase 14)

- [ ] Create `tests/feature/api/staking.test.ts`:
  - [ ] `POST /staking/pool` creates pool (admin only)
  - [ ] `POST /staking/stake` stakes NFT
  - [ ] `POST /staking/unstake` rejects before lock period expires
  - [ ] `POST /staking/claim` returns reward amount
  - [ ] `GET /staking/pools` lists pools with user's stake info
  - [ ] `GET /staking/pool/{id}` returns pool detail
  - [ ] `GET /staking/my-stakes` returns user's stakes

#### Governance Endpoints (Phase 15)

- [ ] Create `tests/feature/api/governance.test.ts`:
  - [ ] `POST /governance/dao` creates DAO (admin only)
  - [ ] `POST /governance/proposals` creates proposal
  - [ ] `GET /governance/proposals` lists proposals
  - [ ] `GET /governance/proposals/{id}` returns proposal with vote tallies
  - [ ] `POST /governance/vote` records vote
  - [ ] `POST /governance/vote` rejects duplicate vote with same NFT
  - [ ] `POST /governance/execute` executes passed proposal
  - [ ] `POST /governance/execute` rejects failed proposal

#### DeFi Endpoints (Phase 16)

- [ ] Create `tests/feature/api/defi.test.ts`:
  - [ ] `GET /defi/swap/quote` returns quote with amounts
  - [ ] `POST /defi/swap/execute` returns tx signature
  - [ ] `POST /actions/mint` returns Blink-compatible response
  - [ ] `POST /actions/buy` returns Blink-compatible response
  - [ ] `GET /.well-known/actions.json` returns valid actions manifest

#### Cross-Marketplace Endpoints (Phase 17)

- [ ] Create `tests/feature/api/cross-marketplace.test.ts`:
  - [ ] `POST /marketplace/nfts/cross-list` lists on multiple marketplaces
  - [ ] `DELETE /marketplace/nfts/cross-list` cancels all cross-listings
  - [ ] `GET /marketplace/nfts/{id}/listings` returns aggregated listings

#### Security Endpoints (Phase 18)

- [ ] Create `tests/feature/api/security.test.ts`:
  - [ ] Rate limiting returns 429 after threshold exceeded
  - [ ] Admin endpoints reject non-admin wallets
  - [ ] Request body size limit rejects oversized payloads
  - [ ] Wallet address validation rejects invalid addresses

---

### 22.5 View & UI Tests

> DOM-based tests verifying view structure, component rendering, and interactive elements.

#### Collection Page Views (Phase 7)

- [ ] Create `tests/feature/views/collection-grid.test.ts`:

  ```ts
  describe('Collection Page - NFT Grid', () => {
    test('renders stats bar with floor price, volume, owners', () => {
      renderHTML(collectionPageHTML)
      expect(querySelector('.stats-floor-price')).not.toBeNull()
      expect(querySelector('.stats-volume')).not.toBeNull()
      expect(querySelector('.stats-owners')).not.toBeNull()
      expect(querySelector('.stats-listed')).not.toBeNull()
    })

    test('renders NFT card with image, name, price, rarity badge', () => {
      renderHTML(collectionPageHTML)
      const cards = querySelectorAll('.nft-card')
      expect(cards.length).toBeGreaterThan(0)
      const card = cards[0]
      expect(card.querySelector('.nft-image')).not.toBeNull()
      expect(card.querySelector('.nft-name')).not.toBeNull()
      expect(card.querySelector('.nft-price')).not.toBeNull()
      expect(card.querySelector('.rarity-badge')).not.toBeNull()
    })

    test('renders grid and list view toggle', () => {
      renderHTML(collectionPageHTML)
      expect(querySelector('.view-toggle-grid')).not.toBeNull()
      expect(querySelector('.view-toggle-list')).not.toBeNull()
    })

    test('renders filter sidebar with trait sections', () => {
      renderHTML(collectionPageHTML)
      expect(querySelector('.filter-sidebar')).not.toBeNull()
      expect(querySelectorAll('.trait-section').length).toBeGreaterThan(0)
    })

    test('renders sort dropdown', () => {
      renderHTML(collectionPageHTML)
      const sort = querySelector('.sort-dropdown')
      expect(sort).not.toBeNull()
    })
  })
  ```

#### NFT Detail Views (Phase 8)

- [ ] Create `tests/feature/views/nft-detail.test.ts`:
  - [ ] Renders full-size NFT artwork
  - [ ] Renders attribute cards with trait type, value, rarity percentage
  - [ ] Renders "Buy Now" button when NFT is listed
  - [ ] Renders "Make Offer" button when NFT is unlisted
  - [ ] Renders "List for Sale" button when viewed by owner
  - [ ] Renders offers tab with offer table
  - [ ] Renders activity tab with event timeline
  - [ ] Renders price history chart container
  - [ ] Renders "More from this collection" section

#### Trading UI (Phase 9)

- [ ] Create `tests/feature/views/trading.test.ts`:
  - [ ] List modal renders price input + fee breakdown
  - [ ] Buy confirmation renders total cost + balance check
  - [ ] Offer modal renders amount input + expiry selector
  - [ ] Transaction toast renders pending/confirmed/failed states
  - [ ] Cart renders with item count and total price

#### Auction Views (Phase 10)

- [ ] Create `tests/feature/views/auction.test.ts`:
  - [ ] English auction page renders countdown timer
  - [ ] English auction page renders bid history table
  - [ ] English auction page renders "Place Bid" with minimum amount
  - [ ] Dutch auction page renders current price (decreasing)
  - [ ] Dutch auction page renders price decay chart
  - [ ] Dutch auction page renders "Buy at Current Price" button

#### Activity & Analytics Views (Phase 11)

- [ ] Create `tests/feature/views/activity.test.ts`:
  - [ ] Activity page renders event feed with type icons
  - [ ] Activity page renders filter checkboxes (sale, listing, offer, etc.)
  - [ ] Activity page renders collection filter dropdown
  - [ ] Analytics tab renders chart containers (floor, volume, sales)

#### Profile Views (Phase 12)

- [ ] Create `tests/feature/views/profile-portfolio.test.ts`:
  - [ ] Profile page renders tab navigation (Owned, Listed, Offers, Activity)
  - [ ] Portfolio header renders wallet address + SOL balance + estimated value
  - [ ] Owned tab renders NFT grid with quick-action buttons (List, Transfer)
  - [ ] Listed tab renders NFTs with "Edit Price" and "Delist" buttons
  - [ ] Offers Received tab renders offers with "Accept" and "Reject" buttons

#### Staking Views (Phase 14)

- [ ] Create `tests/feature/views/staking.test.ts`:
  - [ ] Staking page renders pool list with APY and total staked
  - [ ] Staking page renders "Stake" button per owned NFT
  - [ ] Staking page renders pending rewards with "Claim" button
  - [ ] Staked NFT shows lock period countdown

#### Governance Views (Phase 15)

- [ ] Create `tests/feature/views/governance.test.ts`:
  - [ ] Governance page renders active proposals with voting progress bars
  - [ ] Governance page renders "Create Proposal" button
  - [ ] Proposal detail renders options with vote counts
  - [ ] Proposal detail renders "Vote" button
  - [ ] Treasury section renders balance and recent transactions

---

### 22.6 Integration Tests (End-to-End Flows)

> Full lifecycle tests running through complete user workflows in mock mode.

#### Listing & Buying Flow

- [ ] Create `tests/unit/services/TokenService.trading-flow.test.ts`:

  ```ts
  describe('Trading Flow Integration (mock mode)', () => {
    let service: TokenService

    beforeAll(() => {
      process.env.TOKENS_MOCK_MODE = 'true'
      service = new TokenService()
    })

    test('full list → buy → royalties lifecycle', async () => {
      // 1. List NFT
      const listing = await service.listNFTForSale({
        mint: 'FakeMint...',
        price: 2.0,
        seller: 'FakeSellerWallet...',
      })
      expect(listing.listing_id).toBeDefined()

      // 2. Buy NFT
      const purchase = await service.buyListedNFT({
        mint: 'FakeMint...',
        buyer: 'FakeBuyerWallet...',
        listing_id: listing.listing_id,
      })
      expect(purchase.tx).toBeDefined()
      expect(purchase.success).toBe(true)

      // 3. Verify royalties paid
      const royaltyCheck = await service.verifyRoyaltyPayment({
        txSignature: purchase.tx,
        mint: 'FakeMint...',
      })
      expect(royaltyCheck.paid).toBe(true)
    })
  })
  ```

#### Offer Flow

- [ ] Create `tests/unit/services/TokenService.offer-flow.test.ts`:
  - [ ] Make offer → accept offer → NFT transferred + funds released
  - [ ] Make offer → cancel offer → funds returned
  - [ ] Make offer → reject offer → counter-offer created
  - [ ] Offer expires → funds auto-returned

#### Auction Flow

- [ ] Create `tests/unit/services/TokenService.auction-flow.test.ts`:
  - [ ] Create English auction → place bids → settle → NFT to highest bidder
  - [ ] Create English auction → no bids → cancel auction
  - [ ] Create Dutch auction → buy at current price → instant settlement
  - [ ] Create auction → bid in last 5 minutes → anti-snipe extension

#### Staking Flow

- [ ] Create `tests/unit/services/TokenService.staking-flow.test.ts`:
  - [ ] Create pool → fund pool → stake NFT → accrue rewards → claim → unstake
  - [ ] Stake NFT → try unstake before lock period → rejected → wait → unstake succeeds

#### Governance Flow

- [ ] Create `tests/unit/services/TokenService.governance-flow.test.ts`:
  - [ ] Create DAO → create proposal → cast votes → reach quorum → execute
  - [ ] Create proposal → votes don't reach quorum → proposal fails
  - [ ] Cast vote → try voting again with same NFT → rejected

---

### 22.7 Database & Migration Tests

- [ ] Create `tests/unit/migrations/phase7-migrations.test.ts`:
  - [ ] `marketplace_events` table migration creates all required columns
  - [ ] `collection_stats_snapshots` table migration creates all required columns
  - [ ] Indexes exist on `(collection_id, type, created_at)` for marketplace_events
  - [ ] Indexes exist on `(collection_id, snapshot_at)` for stats snapshots

- [ ] Create `tests/unit/migrations/phase10-migrations.test.ts`:
  - [ ] `auctions` table has `min_bid_increment`, `reserve_price`, `anti_snipe_minutes`, `price_curve` columns
  - [ ] Index exists on `(status, ends_at)` for auctions

- [ ] Create `tests/unit/migrations/phase14-migrations.test.ts`:
  - [ ] `staking_pools` table migration creates all required columns
  - [ ] `stakes` table migration creates all required columns
  - [ ] `staking_rewards` table migration creates all required columns
  - [ ] Foreign keys: `stakes.pool_id` → `staking_pools.id`

- [ ] Create `tests/unit/migrations/phase15-migrations.test.ts`:
  - [ ] `daos` table migration creates all required columns
  - [ ] `proposals` table migration creates all required columns
  - [ ] `votes` table migration creates all required columns
  - [ ] `treasury_transactions` table migration creates all required columns
  - [ ] Foreign keys: `proposals.dao_id` → `daos.id`, `votes.proposal_id` → `proposals.id`

---

### 22.8 Model Tests

- [ ] Create `tests/unit/models/MarketplaceEvent.test.ts`:
  - [ ] Model file exists with correct fields
  - [ ] Has `belongsTo` relationship to `Nft` and `Collection`
  - [ ] Has factory trait for test data generation
  - [ ] Timestamps are auto-generated

- [ ] Create `tests/unit/models/CollectionStatsSnapshot.test.ts`:
  - [ ] Model file exists with correct fields
  - [ ] Has `belongsTo` relationship to `Collection`

- [ ] Create `tests/unit/models/StakingPool.test.ts`:
  - [ ] Model file exists with correct fields
  - [ ] Has `belongsTo` relationship to `Collection`
  - [ ] Has `hasMany` relationship to `Stakes`

- [ ] Create `tests/unit/models/Stake.test.ts`:
  - [ ] Model file exists with correct fields
  - [ ] Has `belongsTo` relationship to `StakingPool` and `Nft`

- [ ] Create `tests/unit/models/DAO.test.ts`:
  - [ ] Model file exists with correct fields
  - [ ] Has `belongsTo` relationship to `Collection`
  - [ ] Has `hasMany` relationship to `Proposals`

- [ ] Create `tests/unit/models/Proposal.test.ts`:
  - [ ] Model file exists with correct fields
  - [ ] Has `belongsTo` relationship to `DAO`
  - [ ] Has `hasMany` relationship to `Votes`

- [ ] Create `tests/unit/models/Vote.test.ts`:
  - [ ] Model file exists with correct fields
  - [ ] Has `belongsTo` relationship to `Proposal`

---

### 22.9 Platform Fee & Royalty Tests

- [ ] Create `tests/unit/fees/fee-calculations.test.ts`:

  ```ts
  describe('Fee Calculations', () => {
    test('platform fee: 1% of 1 SOL = 0.01 SOL', () => {
      expect(calculatePlatformFee(1.0, 100)).toBe(0.01)
    })

    test('platform fee: 1% of 10 SOL = 0.1 SOL', () => {
      expect(calculatePlatformFee(10.0, 100)).toBe(0.1)
    })

    test('royalty: 5% of 2 SOL = 0.1 SOL', () => {
      expect(calculateRoyalty(2.0, 500)).toBe(0.1)
    })

    test('seller receives price minus royalty minus platform fee', () => {
      const price = 5.0
      const royalty = calculateRoyalty(price, 500)       // 0.25
      const platformFee = calculatePlatformFee(price, 100) // 0.05
      const sellerReceives = price - royalty - platformFee  // 4.70
      expect(sellerReceives).toBe(4.70)
    })

    test('creator split: 2 creators at 60/40', () => {
      const royalty = 0.25 // SOL
      const creator1Share = royalty * 0.6 // 0.15
      const creator2Share = royalty * 0.4 // 0.10
      expect(creator1Share + creator2Share).toBe(royalty)
    })

    test('zero price results in zero fees', () => {
      expect(calculatePlatformFee(0, 100)).toBe(0)
      expect(calculateRoyalty(0, 500)).toBe(0)
    })

    test('fee basis points of 0 results in zero fee', () => {
      expect(calculatePlatformFee(10.0, 0)).toBe(0)
    })
  })
  ```

---

### 22.10 Rate Limiting & Validation Tests

- [ ] Create `tests/unit/security/rate-limiting.test.ts`:

  ```ts
  describe('Rate Limiting', () => {
    test('allows requests under limit', () => {
      const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 })
      const wallet = 'FakeWallet...'
      expect(limiter.check(wallet)).toBe(true)
      expect(limiter.check(wallet)).toBe(true)
      expect(limiter.check(wallet)).toBe(true)
    })

    test('blocks requests over limit', () => {
      const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 })
      const wallet = 'FakeWallet...'
      limiter.check(wallet) // 1
      limiter.check(wallet) // 2
      limiter.check(wallet) // 3
      expect(limiter.check(wallet)).toBe(false) // blocked
    })

    test('different wallets have independent limits', () => {
      const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })
      expect(limiter.check('Wallet1')).toBe(true)
      expect(limiter.check('Wallet2')).toBe(true)
      expect(limiter.check('Wallet1')).toBe(false)
    })
  })
  ```

- [ ] Create `tests/unit/security/input-validation.test.ts`:
  - [ ] Valid Solana address (32 bytes base58) passes validation
  - [ ] Invalid address (too short, invalid characters) fails validation
  - [ ] Price validation rejects negative amounts
  - [ ] Price validation rejects non-numeric input
  - [ ] Auction duration validation enforces min/max bounds
  - [ ] Offer expiry validation rejects past dates

---

### 22.11 Component Tests

- [ ] Create `tests/unit/components/NFTCard.test.ts`:
  - [ ] Renders image, name, price, rarity badge
  - [ ] Shows "Buy" button for listed NFTs
  - [ ] Shows "Make Offer" for unlisted NFTs
  - [ ] Shows staked badge for staked NFTs

- [ ] Create `tests/unit/components/TransactionToast.test.ts`:
  - [ ] Renders pending state with spinner
  - [ ] Renders confirmed state with checkmark
  - [ ] Renders failed state with error message and retry button

- [ ] Create `tests/unit/components/FilterSidebar.test.ts`:
  - [ ] Renders trait sections with checkboxes
  - [ ] Renders price range inputs
  - [ ] Renders rarity level checkboxes
  - [ ] Renders "Clear All" button

- [ ] Create `tests/unit/components/StatsBar.test.ts`:
  - [ ] Renders floor price with delta arrow
  - [ ] Renders listed count
  - [ ] Renders volume in SOL
  - [ ] Renders owners count

- [ ] Create `tests/unit/components/AuctionTimer.test.ts`:
  - [ ] Renders countdown in h:m:s format
  - [ ] Shows "Ended" when auction expired
  - [ ] Shows "Starting soon" for future auctions

---

### 22.12 Performance & Load Tests

- [ ] Create `tests/performance/api-response-times.test.ts`:

  ```ts
  describe('API Response Times', () => {
    test('GET /marketplace/collections/{slug}/nfts responds within 500ms', async () => {
      const start = performance.now()
      await apiGet('/marketplace/collections/hoodies/nfts', { limit: '50' })
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(500)
    })

    test('GET /marketplace/collections/{slug}/stats responds within 200ms', async () => {
      const start = performance.now()
      await apiGet('/marketplace/collections/hoodies/stats')
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(200)
    })

    test('GET /marketplace/activity responds within 300ms', async () => {
      const start = performance.now()
      await apiGet('/marketplace/activity', { limit: '50' })
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(300)
    })

    test('POST /marketplace/nfts/batch-buy handles 10 items within 1000ms', async () => {
      const mints = Array.from({ length: 10 }, (_, i) => `FakeMint${i}...`)
      const start = performance.now()
      await authenticatedPost('/marketplace/nfts/batch-buy', {
        mints, buyer: 'FakeWallet...',
      }, 'FakeWallet...')
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(1000)
    })
  })
  ```

- [ ] Create `tests/performance/pagination.test.ts`:
  - [ ] Cursor-based pagination returns consistent results across pages
  - [ ] No duplicate items between pages
  - [ ] Last page returns empty cursor
  - [ ] Large offset (page 100) doesn't degrade performance

- [ ] Create `tests/performance/concurrent-requests.test.ts`:
  - [ ] 10 concurrent reads to collection endpoint complete without errors
  - [ ] 5 concurrent offer submissions don't create duplicate offers
  - [ ] Concurrent bid submissions correctly identify highest bidder

---

### 22.13 Test Coverage Targets

- [ ] **TokenService methods**: 100% coverage (all methods tested in mock mode)
- [ ] **Actions**: 100% coverage (every action has structure + behavior tests)
- [ ] **API endpoints**: 100% coverage (every route tested with valid + invalid input)
- [ ] **Models**: 100% coverage (all relationships and field validations)
- [ ] **Views**: 90%+ coverage (all critical UI elements verified)
- [ ] **Fee calculations**: 100% coverage (all edge cases)
- [ ] **Validation**: 100% coverage (all input validation rules)
- [ ] Overall target: **95%+ line coverage** reported by `bun test --coverage`

### 22.14 CI Integration

- [ ] `bun test` runs all unit + feature tests
- [ ] `bun test --coverage` generates coverage report
- [ ] Tests run on every PR via GitHub Actions
- [ ] Coverage gate: PR blocked if coverage drops below 90%
- [ ] Performance tests run nightly (not on every PR)
- [ ] Test report published as PR comment

---

## Recommended Implementation Order

> Suggested order based on dependencies, user value, and incremental delivery. Tests are written alongside each sprint, not deferred.

### Sprint 1: Browsing & Discovery (Weeks 1-3)

1. Phase 7: Collection browsing & NFT grid
2. Phase 13: Search, filters & sorting
3. Phase 8: NFT detail page
4. Phase 22.3 (collection/NFT actions), 22.4 (collection/NFT API tests), 22.5 (collection/NFT view tests)

### Sprint 2: Trading Core (Weeks 4-6)

5. Phase 9: Trading UX — listings, buying & offers
6. Phase 10: Auctions
7. Phase 12: User profile & portfolio
8. Phase 22.3 (trading/auction actions), 22.4 (trading/auction API tests), 22.5 (trading/auction view tests), 22.6 (trading flow integration), 22.9 (fee tests)

### Sprint 3: Insights & Community (Weeks 7-9)

9. Phase 11: Activity feed & analytics
10. Phase 14: Staking & rewards
11. Phase 15: Governance & DAO
12. Phase 22.3 (activity/staking/governance actions), 22.4 (activity/staking/governance API tests), 22.5 (activity/staking/governance view tests), 22.6 (staking/governance flow integration), 22.7 (migration tests), 22.8 (model tests)

### Sprint 4: Advanced Features (Weeks 10-12)

13. Phase 16: DeFi integration
14. Phase 17: Cross-marketplace aggregation
15. Phase 22.2 (defi/crossmarket service tests), 22.4 (defi/crossmarket API tests)

### Sprint 5: Hardening & Launch (Weeks 13-15)

16. Phase 18: Security hardening
17. Phase 19: Performance & infrastructure
18. Phase 20: Mobile & responsive design
19. Phase 21: Polish & launch
20. Phase 22.10 (rate limiting/validation), 22.11 (component tests), 22.12 (performance tests), 22.13 (coverage targets), 22.14 (CI integration)

> Suggested order based on dependencies, user value, and incremental delivery.

### Sprint 1: Browsing & Discovery (Weeks 1-3)

1. Phase 7: Collection browsing & NFT grid
2. Phase 13: Search, filters & sorting
3. Phase 8: NFT detail page

### Sprint 2: Trading Core (Weeks 4-6)

4. Phase 9: Trading UX — listings, buying & offers
5. Phase 10: Auctions
6. Phase 12: User profile & portfolio

### Sprint 3: Insights & Community (Weeks 7-9)

7. Phase 11: Activity feed & analytics
8. Phase 14: Staking & rewards
9. Phase 15: Governance & DAO

### Sprint 4: Advanced Features (Weeks 10-12)

10. Phase 16: DeFi integration
11. Phase 17: Cross-marketplace aggregation

### Sprint 5: Hardening & Launch (Weeks 13-15)

12. Phase 18: Security hardening
13. Phase 19: Performance & infrastructure
14. Phase 20: Mobile & responsive design
15. Phase 21: Polish & launch

---

## Notes

- **Blockchain**: Solana is the only supported chain. All on-chain operations go through `ts-tokens`.
- **Mock Mode**: All `TokenService` methods support `TOKENS_MOCK_MODE=true` for development without hitting Solana.
- **Testing**: Always test on devnet before mainnet. Use mock mode for unit tests.
- **Security**: Never commit private keys or RPC API keys. Use environment variables.
- **ts-tokens Modules Used**: `ts-tokens/nft`, `ts-tokens/marketplace`, `ts-tokens/staking`, `ts-tokens/defi`, `ts-tokens/batch`, `ts-tokens/security`, `ts-tokens/debug`, `ts-tokens/actions`, `ts-tokens/wallets`, `ts-tokens/analytics`, `ts-tokens/indexer`, `ts-governance`.
- **Framework**: Built on Stacks.js with STX views, Buddy CLI, and Crosswind CSS.
- **DX**: Maintain mock mode parity for all new features — every `TokenService` method must work with and without Solana.

---

*Last updated: March 2026*
