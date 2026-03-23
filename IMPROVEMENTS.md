# Token Marketplace — Improvement Plan

> A prioritized roadmap for evolving the Hoodies NFT marketplace into a competitive, community-owned Solana trading platform. Each phase includes rationale, implementation details, and sample code.

## Table of Contents

- [Phase A: Self-Hosted NFT Indexer](#phase-a-self-hosted-nft-indexer)
- [Phase B: Real-Time WebSocket Infrastructure](#phase-b-real-time-websocket-infrastructure)
- [Phase C: Compressed NFT (cNFT) Support](#phase-c-compressed-nft-cnft-support)
- [Phase D: Community-Owned Marketplace (Differentiator)](#phase-d-community-owned-marketplace-differentiator)
- [Phase E: Creator Launchpad & Tools](#phase-e-creator-launchpad--tools)
- [Phase F: Liquidity Bootstrap & Aggregation](#phase-f-liquidity-bootstrap--aggregation)
- [Phase G: MEV Protection & Transaction Optimization](#phase-g-mev-protection--transaction-optimization)
- [Phase H: Image CDN & Media Pipeline](#phase-h-image-cdn--media-pipeline)
- [Phase I: Priority Fee Estimation](#phase-i-priority-fee-estimation)
- [Phase J: Remaining TODO Gaps](#phase-j-remaining-todo-gaps)
- [Phase K: Testing & Quality Assurance](#phase-k-testing--quality-assurance)
- [Recommended Implementation Order](#recommended-implementation-order)

---

## Phase A: Self-Hosted NFT Indexer

> **Why**: Since we control minting, we already know every NFT in our ecosystem. We don't need to index all of Solana — just track our own collections. This gives us the same speed as Helius DAS (sub-second queries, structured data) with zero external dependencies and zero API costs. Our DB is already the source of truth for mints; we just need to keep it in sync with on-chain ownership changes.

### A.1 NFT Indexer Service

- [ ] Create `app/Services/IndexerService.ts` — tracks ownership, transfers, and metadata for our collections
- [ ] On mint: automatically index the new NFT (already happens via `MintNftAction`)
- [ ] Periodic sync: poll on-chain ownership for our known mint addresses to catch external transfers
- [ ] Metadata cache: fetch and store Arweave/IPFS metadata locally

```ts
// app/Services/IndexerService.ts
import { db } from '@stacksjs/database'
import { Connection, PublicKey } from '@solana/web3.js'
import { cacheService } from './CacheService'

class IndexerService {
  private connection: Connection
  private pollIntervalMs = 30_000 // 30 seconds

  constructor() {
    this.connection = new Connection(
      process.env.RPC_URL || 'https://api.devnet.solana.com',
      'confirmed',
    )
  }

  /**
   * Index an NFT at mint time — called from MintNftAction
   * Since we mint it, we have all the data already. No external API needed.
   */
  async indexOnMint(data: {
    mint: string
    name: string
    symbol: string
    uri: string           // metadata URI (Arweave/IPFS)
    owner: string
    collectionId: number
    attributes?: Array<{ trait_type: string, value: string }>
    image?: string
    compressed?: boolean
    treeAddress?: string
    leafIndex?: number
  }) {
    // Fetch and cache the full metadata JSON
    const metadata = await this.fetchAndCacheMetadata(data.mint, data.uri)

    await db
      .insertInto('nfts')
      .values({
        mint_address: data.mint,
        name: data.name,
        symbol: data.symbol,
        metadata_uri: data.uri,
        image_url: data.image || metadata?.image || '',
        owner_wallet: data.owner,
        collection_id: data.collectionId,
        attributes: JSON.stringify(data.attributes || metadata?.attributes || []),
        is_compressed: data.compressed || false,
        tree_address: data.treeAddress || null,
        leaf_index: data.leafIndex || null,
        status: 'unlisted',
        indexed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict(oc => oc.column('mint_address').doUpdateSet({
        owner_wallet: data.owner,
        updated_at: new Date(),
      }))
      .execute()

    // Index individual traits for filtering
    if (data.attributes?.length) {
      await this.indexTraits(data.mint, data.collectionId, data.attributes)
    }
  }

  /**
   * Sync ownership for all NFTs in a collection
   * Catches transfers that happened outside our platform (wallets, other marketplaces)
   * Run this on a schedule — every 30s for active collections, every 5min for others
   */
  async syncCollectionOwnership(collectionId: number) {
    const nfts = await db
      .selectFrom('nfts')
      .where('collection_id', '=', collectionId)
      .where('is_compressed', '=', false) // Regular NFTs only — cNFTs use different method
      .select(['id', 'mint_address', 'owner_wallet'])
      .execute()

    // Batch RPC calls — fetch token accounts for all mints at once
    // Process in chunks of 100 to avoid RPC limits
    const chunks = this.chunk(nfts, 100)

    for (const chunk of chunks) {
      const mintKeys = chunk.map(n => new PublicKey(n.mint_address))

      // getMultipleAccountsInfo is a single RPC call for up to 100 accounts
      const tokenAccounts = await this.connection.getMultipleAccountsInfo(mintKeys)

      for (let i = 0; i < chunk.length; i++) {
        const nft = chunk[i]
        const accountInfo = tokenAccounts[i]

        if (!accountInfo) continue

        // Parse the token account to get current owner
        // For NFTs, the largest token account holder is the owner
        const currentOwner = await this.getTokenOwner(nft.mint_address)

        if (currentOwner && currentOwner !== nft.owner_wallet) {
          // Ownership changed outside our platform — update DB
          await db
            .updateTable('nfts')
            .set({
              owner_wallet: currentOwner,
              status: 'unlisted',     // Delist if transferred
              listing_price: null,
              updated_at: new Date(),
            })
            .where('id', '=', nft.id)
            .execute()

          // Record the transfer event
          await db
            .insertInto('marketplace_events')
            .values({
              type: 'transfer',
              nft_id: nft.id,
              collection_id: collectionId,
              from_wallet: nft.owner_wallet,
              to_wallet: currentOwner,
              source: 'external',
              tx_signature: '',       // We don't know the tx — just the result
              created_at: new Date(),
            })
            .execute()
        }
      }
    }
  }

  /**
   * Get the current owner of an NFT by finding the largest token account
   */
  private async getTokenOwner(mintAddress: string): Promise<string | null> {
    try {
      const largestAccounts = await this.connection.getTokenLargestAccounts(
        new PublicKey(mintAddress),
      )

      // NFT — the account with amount=1 is the owner
      const ownerAccount = largestAccounts.value.find(
        a => Number(a.amount) === 1,
      )

      if (!ownerAccount) return null

      // Get the actual wallet that owns this token account
      const accountInfo = await this.connection.getParsedAccountInfo(ownerAccount.address)
      const parsed = (accountInfo.value?.data as any)?.parsed

      return parsed?.info?.owner || null
    }
    catch {
      return null
    }
  }

  /**
   * Fetch metadata JSON from Arweave/IPFS and cache it locally
   * Only needs to happen once per NFT — metadata is immutable
   */
  async fetchAndCacheMetadata(
    mintAddress: string,
    uri: string,
  ): Promise<NFTMetadata | null> {
    const cacheKey = `metadata:${mintAddress}`
    const cached = await cacheService.get(cacheKey)
    if (cached) return JSON.parse(cached)

    try {
      const response = await fetch(uri, { signal: AbortSignal.timeout(10_000) })
      const metadata: NFTMetadata = await response.json()

      // Cache forever — metadata doesn't change
      await cacheService.set(cacheKey, JSON.stringify(metadata), 0)

      // Also store in DB for fast queries
      await db
        .updateTable('nfts')
        .set({
          image_url: metadata.image || '',
          attributes: JSON.stringify(metadata.attributes || []),
        })
        .where('mint_address', '=', mintAddress)
        .execute()

      return metadata
    }
    catch (e) {
      console.error(`Failed to fetch metadata for ${mintAddress}: ${e}`)
      return null
    }
  }

  /**
   * Index trait values for fast filtering
   * "Show me all NFTs with Background=Purple AND Hat=Crown"
   */
  private async indexTraits(
    mintAddress: string,
    collectionId: number,
    attributes: Array<{ trait_type: string, value: string }>,
  ) {
    for (const attr of attributes) {
      await db
        .insertInto('nft_traits')
        .values({
          mint_address: mintAddress,
          collection_id: collectionId,
          trait_type: attr.trait_type,
          trait_value: attr.value,
        })
        .onConflict(oc =>
          oc.columns(['mint_address', 'trait_type']).doUpdateSet({
            trait_value: attr.value,
          }),
        )
        .execute()
    }

    // Update trait counts for the collection (for filter sidebar)
    await this.refreshTraitCounts(collectionId)
  }

  /**
   * Refresh aggregated trait counts for a collection
   * Powers the filter sidebar: "Background: Purple (342), Blue (1,205)"
   */
  async refreshTraitCounts(collectionId: number) {
    const counts = await db
      .selectFrom('nft_traits')
      .where('collection_id', '=', collectionId)
      .groupBy(['trait_type', 'trait_value'])
      .select([
        'trait_type',
        'trait_value',
        db.fn.count('mint_address').as('count'),
      ])
      .execute()

    // Cache for fast access
    await cacheService.set(
      `trait_counts:${collectionId}`,
      JSON.stringify(counts),
      300, // 5 min TTL
    )
  }

  /**
   * Get collection-level stats from our own indexed data
   * No external API needed — we ARE the index
   */
  async getCollectionStats(collectionId: number) {
    const [nftStats, volumeStats] = await Promise.all([
      db
        .selectFrom('nfts')
        .where('collection_id', '=', collectionId)
        .select([
          db.fn.count('id').as('total_supply'),
          db.fn.count(db.raw(`CASE WHEN status = 'listed' THEN 1 END`)).as('listed_count'),
          db.fn.min(db.raw(`CASE WHEN status = 'listed' THEN listing_price END`)).as('floor_price'),
          db.fn.countDistinct('owner_wallet').as('unique_owners'),
        ])
        .executeTakeFirst(),

      db
        .selectFrom('marketplace_events')
        .where('collection_id', '=', collectionId)
        .where('type', '=', 'sale')
        .select([
          db.fn.sum('price').as('total_volume'),
          db.fn.count('id').as('total_sales'),
        ])
        .executeTakeFirst(),
    ])

    return {
      totalSupply: Number(nftStats?.total_supply || 0),
      listedCount: Number(nftStats?.listed_count || 0),
      floorPrice: Number(nftStats?.floor_price || 0),
      uniqueOwners: Number(nftStats?.unique_owners || 0),
      totalVolume: Number(volumeStats?.total_volume || 0),
      totalSales: Number(volumeStats?.total_sales || 0),
    }
  }

  /**
   * Search NFTs across all our collections
   * Full-text search on name, with trait/price/status filtering
   */
  async searchNFTs(query: string, filters: {
    collectionId?: number
    status?: 'listed' | 'unlisted' | 'all'
    minPrice?: number
    maxPrice?: number
    traits?: Record<string, string[]>
    sort?: 'price_asc' | 'price_desc' | 'recent' | 'name'
    cursor?: number
    limit?: number
  } = {}) {
    let q = db
      .selectFrom('nfts')
      .selectAll()

    // Full-text search on name
    if (query) {
      q = q.where('name', 'ilike', `%${query}%`)
    }

    if (filters.collectionId) {
      q = q.where('collection_id', '=', filters.collectionId)
    }

    if (filters.status && filters.status !== 'all') {
      q = q.where('status', '=', filters.status)
    }

    if (filters.minPrice !== undefined) {
      q = q.where('listing_price', '>=', filters.minPrice)
    }

    if (filters.maxPrice !== undefined) {
      q = q.where('listing_price', '<=', filters.maxPrice)
    }

    // Trait filtering via subquery
    if (filters.traits) {
      for (const [traitType, traitValues] of Object.entries(filters.traits)) {
        q = q.where('mint_address', 'in',
          db.selectFrom('nft_traits')
            .where('trait_type', '=', traitType)
            .where('trait_value', 'in', traitValues)
            .select('mint_address'),
        )
      }
    }

    // Sorting
    switch (filters.sort) {
      case 'price_asc':
        q = q.orderBy('listing_price', 'asc')
        break
      case 'price_desc':
        q = q.orderBy('listing_price', 'desc')
        break
      case 'name':
        q = q.orderBy('name', 'asc')
        break
      case 'recent':
      default:
        q = q.orderBy('created_at', 'desc')
    }

    // Cursor pagination
    if (filters.cursor) {
      q = q.where('id', '>', filters.cursor)
    }

    q = q.limit(filters.limit || 50)

    return q.execute()
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size))
    }
    return chunks
  }
}

interface NFTMetadata {
  name: string
  symbol: string
  description: string
  image: string
  animation_url?: string
  external_url?: string
  attributes?: Array<{ trait_type: string, value: string }>
  properties?: {
    files?: Array<{ uri: string, type: string }>
    category?: string
    creators?: Array<{ address: string, share: number }>
  }
}

export const indexerService = new IndexerService()
```

### A.2 Database Tables for Indexing

- [ ] Create `nft_traits` table for fast trait-based filtering
- [ ] Add indexing columns to `nfts` table
- [ ] Create `marketplace_events` table (also needed by Phase J)

```ts
// database/migrations/create_nft_traits_table.ts

import type { Database } from '@stacksjs/database'

export async function up(db: Database) {
  await db.schema
    .createTable('nft_traits')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('mint_address', 'varchar(64)', col => col.notNull())
    .addColumn('collection_id', 'integer', col => col.notNull())
    .addColumn('trait_type', 'varchar(100)', col => col.notNull())
    .addColumn('trait_value', 'varchar(255)', col => col.notNull())
    .addUniqueConstraint('uq_mint_trait', ['mint_address', 'trait_type'])
    .execute()

  // Indexes for fast filtering
  await db.schema
    .createIndex('idx_traits_collection_type_value')
    .on('nft_traits')
    .columns(['collection_id', 'trait_type', 'trait_value'])
    .execute()

  await db.schema
    .createIndex('idx_traits_mint')
    .on('nft_traits')
    .column('mint_address')
    .execute()
}
```

```ts
// Add to nfts table migration (or create a new migration to add columns):

await db.schema
  .alterTable('nfts')
  .addColumn('is_compressed', 'boolean', col => col.defaultTo(false))
  .addColumn('tree_address', 'varchar(64)')
  .addColumn('leaf_index', 'integer')
  .addColumn('indexed_at', 'timestamp')
  .addColumn('metadata_uri', 'varchar(500)')
  .addColumn('attributes', 'text')  // JSON string of attributes
  .execute()

// Index for ownership queries
await db.schema
  .createIndex('idx_nfts_owner_collection')
  .on('nfts')
  .columns(['owner_wallet', 'collection_id'])
  .execute()

// Index for listing queries
await db.schema
  .createIndex('idx_nfts_status_price')
  .on('nfts')
  .columns(['status', 'listing_price'])
  .execute()
```

### A.3 On-Chain Ownership Poller

- [ ] Create background job that polls on-chain ownership for active collections
- [ ] Detect external transfers (someone sends NFT via Phantom, not through our marketplace)
- [ ] Update DB ownership and auto-delist transferred NFTs
- [ ] Configurable poll frequency per collection (active = 30s, idle = 5min)

```ts
// app/Jobs/SyncOwnershipJob.ts
import { indexerService } from '../Services/IndexerService'
import { db } from '@stacksjs/database'

export async function handle() {
  // Get all active collections
  const collections = await db
    .selectFrom('collections')
    .where('status', '=', 'active')
    .select(['id', 'slug', 'supply'])
    .execute()

  for (const collection of collections) {
    try {
      await indexerService.syncCollectionOwnership(collection.id)
      console.log(`Synced ownership for ${collection.slug}`)
    }
    catch (e) {
      console.error(`Failed to sync ${collection.slug}: ${e}`)
    }
  }
}

// Schedule: run every 30 seconds
// In your cron/scheduler config:
// { job: 'SyncOwnershipJob', schedule: '*/30 * * * * *' }
```

### A.4 Transaction Listener (Solana Account Subscription)

- [ ] Subscribe to on-chain account changes for our marketplace PDA
- [ ] Catch listing/delisting/sale events in real-time without polling
- [ ] Fallback to polling if WebSocket connection drops

```ts
// app/Services/TransactionListenerService.ts
import { Connection, PublicKey } from '@solana/web3.js'
import { db } from '@stacksjs/database'
import { wsService } from './WebSocketService'

class TransactionListenerService {
  private connection: Connection
  private subscriptionIds: Map<string, number> = new Map()

  constructor() {
    this.connection = new Connection(
      process.env.RPC_WSS_URL || 'wss://api.devnet.solana.com',
      'confirmed',
    )
  }

  /**
   * Subscribe to token account changes for a collection's NFT mints
   * This catches transfers, listings, and sales in real-time
   * Uses Solana's native WebSocket subscription — no third-party API needed
   */
  async watchCollection(collectionId: number) {
    const nfts = await db
      .selectFrom('nfts')
      .where('collection_id', '=', collectionId)
      .select(['mint_address'])
      .execute()

    for (const nft of nfts) {
      this.watchMint(nft.mint_address, collectionId)
    }
  }

  /**
   * Watch a single NFT mint for account changes
   * Triggers when the token account is modified (transfer, delegate, etc.)
   */
  watchMint(mintAddress: string, collectionId: number) {
    if (this.subscriptionIds.has(mintAddress)) return

    const mintPubkey = new PublicKey(mintAddress)

    // Subscribe to all token accounts for this mint
    const subId = this.connection.onProgramAccountChange(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token program
      async (accountInfo, context) => {
        // Parse the token account data to get new owner
        const data = accountInfo.accountInfo.data
        if (data.length < 72) return

        // Token account layout: mint (32) + owner (32) + amount (8)
        const owner = new PublicKey(data.slice(32, 64)).toBase58()
        const amount = data.readBigUInt64LE(64)

        if (Number(amount) !== 1) return // Not the active holder

        // Check if ownership changed
        const existing = await db
          .selectFrom('nfts')
          .where('mint_address', '=', mintAddress)
          .select(['id', 'owner_wallet', 'status'])
          .executeTakeFirst()

        if (existing && existing.owner_wallet !== owner) {
          const previousOwner = existing.owner_wallet

          await db
            .updateTable('nfts')
            .set({
              owner_wallet: owner,
              status: 'unlisted',
              listing_price: null,
              updated_at: new Date(),
            })
            .where('id', '=', existing.id)
            .execute()

          // Record event
          await db
            .insertInto('marketplace_events')
            .values({
              type: 'transfer',
              nft_id: existing.id,
              collection_id: collectionId,
              from_wallet: previousOwner,
              to_wallet: owner,
              source: 'onchain',
              created_at: new Date(),
            })
            .execute()

          // Push real-time update via WebSocket
          wsService.broadcastMarketplaceEvent({
            type: 'transfer',
            nftMint: mintAddress,
            collectionSlug: '', // resolve from collectionId
            from: previousOwner,
            to: owner,
            txSignature: '',
          })
        }
      },
      'confirmed',
      [{ memcmp: { offset: 0, bytes: mintPubkey.toBase58() } }],
    )

    this.subscriptionIds.set(mintAddress, subId)
  }

  /**
   * Unsubscribe from a mint's account changes
   */
  async unwatchMint(mintAddress: string) {
    const subId = this.subscriptionIds.get(mintAddress)
    if (subId !== undefined) {
      await this.connection.removeProgramAccountChangeListener(subId)
      this.subscriptionIds.delete(mintAddress)
    }
  }

  /**
   * Get subscription stats
   */
  getStats() {
    return {
      watchedMints: this.subscriptionIds.size,
    }
  }
}

export const txListenerService = new TransactionListenerService()
```

### A.5 Wire Indexer into Existing Actions

- [ ] Update `MintNftAction` to call `indexerService.indexOnMint()` after successful mint
- [ ] Update `ListNftAction` / `DelistNftAction` / `BuyNftAction` to update indexed data
- [ ] Update `CollectionNftsAction` to query from indexed DB instead of RPC
- [ ] Update `ProfilePortfolioAction` to use indexed ownership data
- [ ] Update `SearchAction` to use `indexerService.searchNFTs()`

```ts
// Example: wire indexer into MintNftAction (add after successful mint)

// In app/Actions/Mint/MintNftAction.ts — after minting succeeds:
await indexerService.indexOnMint({
  mint: result.mintAddress,
  name: nftName,
  symbol: collectionSymbol,
  uri: metadataUri,
  owner: buyerWallet,
  collectionId: collection.id,
  attributes: metadata.attributes,
  image: metadata.image,
  compressed: useCompressed,
  treeAddress: result.treeAddress,
  leafIndex: result.leafIndex,
})
```

```ts
// Example: update CollectionNftsAction to query indexed DB

// Before (hitting RPC):
// const nfts = await tokenService.getNFTsByCollection(collectionMint)

// After (querying our index):
const nfts = await indexerService.searchNFTs('', {
  collectionId: collection.id,
  status: filters.status || 'all',
  minPrice: filters.minPrice,
  maxPrice: filters.maxPrice,
  traits: filters.traits,
  sort: filters.sort || 'recent',
  cursor: filters.cursor,
  limit: 50,
})
```

### A.6 Startup Initialization

- [ ] On server start: begin watching all active collections
- [ ] Graceful shutdown: unsubscribe from all watchers

```ts
// In server startup (e.g., app bootstrap or server.ts):

import { indexerService } from './app/Services/IndexerService'
import { txListenerService } from './app/Services/TransactionListenerService'
import { db } from '@stacksjs/database'

async function startIndexer() {
  const collections = await db
    .selectFrom('collections')
    .where('status', '=', 'active')
    .select(['id', 'slug'])
    .execute()

  for (const collection of collections) {
    await txListenerService.watchCollection(collection.id)
    console.log(`Watching collection: ${collection.slug}`)
  }

  console.log(`Indexer started — watching ${collections.length} collections`)
}

startIndexer()
```

---

## Phase B: Real-Time WebSocket Infrastructure

> **Why**: A trading platform without real-time updates feels dead. Users need to see new listings, price changes, and auction bids the instant they happen — not after a 30-second poll. Our self-hosted indexer (Phase A) detects on-chain changes; WebSockets push them to the browser.

### B.1 WebSocket Server

- [ ] Create WebSocket server alongside HTTP server
- [ ] Channel-based subscriptions (per-collection, per-NFT, per-wallet)
- [ ] Heartbeat/keepalive for connection health

```ts
// app/Services/WebSocketService.ts

interface WSClient {
  ws: WebSocket
  subscriptions: Set<string>  // e.g., 'collection:hoodies', 'nft:ABC123', 'wallet:XYZ'
  lastPing: number
}

class WebSocketService {
  private clients: Map<string, WSClient> = new Map()

  /**
   * Handle new WebSocket connection
   * Client sends subscription messages to register interest in channels
   */
  handleConnection(ws: WebSocket, clientId: string) {
    this.clients.set(clientId, {
      ws,
      subscriptions: new Set(),
      lastPing: Date.now(),
    })

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data as string)

      switch (msg.type) {
        case 'subscribe':
          // msg.channels = ['collection:hoodies', 'nft:ABC123']
          for (const channel of msg.channels) {
            this.clients.get(clientId)?.subscriptions.add(channel)
          }
          ws.send(JSON.stringify({
            type: 'subscribed',
            channels: msg.channels,
          }))
          break

        case 'unsubscribe':
          for (const channel of msg.channels) {
            this.clients.get(clientId)?.subscriptions.delete(channel)
          }
          break

        case 'pong':
          const client = this.clients.get(clientId)
          if (client) client.lastPing = Date.now()
          break
      }
    })

    ws.addEventListener('close', () => {
      this.clients.delete(clientId)
    })
  }

  /**
   * Broadcast an event to all clients subscribed to matching channels
   * Called from the Helius webhook handler
   */
  broadcast(channels: string[], event: MarketplaceWSEvent) {
    const payload = JSON.stringify(event)

    for (const [_clientId, client] of this.clients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue

      const isSubscribed = channels.some(ch => client.subscriptions.has(ch))
      if (isSubscribed) {
        client.ws.send(payload)
      }
    }
  }

  /**
   * Broadcast marketplace events from Helius webhook
   */
  broadcastMarketplaceEvent(event: {
    type: string
    nftMint: string
    collectionSlug: string
    price?: number
    from?: string
    to?: string
    txSignature: string
  }) {
    const channels = [
      `collection:${event.collectionSlug}`,
      `nft:${event.nftMint}`,
    ]

    // Also notify wallet-specific subscribers
    if (event.from) channels.push(`wallet:${event.from}`)
    if (event.to) channels.push(`wallet:${event.to}`)

    this.broadcast(channels, {
      type: 'marketplace_event',
      data: event,
      timestamp: Date.now(),
    })
  }

  /**
   * Heartbeat — ping all clients, disconnect stale ones
   */
  startHeartbeat(intervalMs = 30_000) {
    setInterval(() => {
      const now = Date.now()
      for (const [clientId, client] of this.clients) {
        if (now - client.lastPing > intervalMs * 3) {
          client.ws.close()
          this.clients.delete(clientId)
          continue
        }
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({ type: 'ping' }))
        }
      }
    }, intervalMs)
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      totalSubscriptions: Array.from(this.clients.values())
        .reduce((sum, c) => sum + c.subscriptions.size, 0),
    }
  }
}

interface MarketplaceWSEvent {
  type: string
  data: unknown
  timestamp: number
}

export const wsService = new WebSocketService()
```

### B.2 Client-Side WebSocket Manager

- [ ] Create reusable WebSocket client for STX views
- [ ] Auto-reconnect with exponential backoff
- [ ] Event-driven updates to DOM elements

```ts
// public/js/ws-client.js

class MarketplaceWS {
  constructor(options = {}) {
    this.url = options.url || `wss://${window.location.host}/ws`
    this.reconnectDelay = 1000
    this.maxReconnectDelay = 30000
    this.listeners = new Map()
    this.subscriptions = new Set()
    this.connect()
  }

  connect() {
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('[WS] Connected')
      this.reconnectDelay = 1000

      // Resubscribe to channels after reconnect
      if (this.subscriptions.size > 0) {
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          channels: Array.from(this.subscriptions),
        }))
      }
    }

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === 'ping') {
        this.ws.send(JSON.stringify({ type: 'pong' }))
        return
      }

      // Dispatch to listeners
      const handlers = this.listeners.get(msg.type) || []
      handlers.forEach(fn => fn(msg.data))
    }

    this.ws.onclose = () => {
      console.log(`[WS] Disconnected, reconnecting in ${this.reconnectDelay}ms`)
      setTimeout(() => this.connect(), this.reconnectDelay)
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
    }
  }

  /**
   * Subscribe to a channel
   * Usage: ws.subscribe('collection:hoodies')
   */
  subscribe(channel) {
    this.subscriptions.add(channel)
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channels: [channel],
      }))
    }
  }

  /**
   * Listen for a specific event type
   * Usage: ws.on('marketplace_event', (data) => updateUI(data))
   */
  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType).push(handler)
  }

  disconnect() {
    this.ws.close()
  }
}

// Usage in STX views:
// const ws = new MarketplaceWS()
// ws.subscribe('collection:hoodies')
// ws.on('marketplace_event', (event) => {
//   if (event.type === 'sale') updateFloorPrice(event.price)
//   if (event.type === 'listing') addNewListing(event)
// })
```

### B.3 Real-Time UI Updates

- [ ] Collection page: auto-update floor price, listed count, volume when events arrive
- [ ] NFT detail page: update offer list, price, owner when events arrive
- [ ] Activity feed: prepend new events without page reload
- [ ] Auction page: live bid updates with countdown sync

### B.4 Integration with Self-Hosted Indexer

- [ ] Wire `TransactionListenerService` (Phase A.4) to broadcast via WebSocket service
- [ ] Wire marketplace actions (list, buy, offer) to broadcast on success
- [ ] Deduplicate events (same tx signature within 5s window)

```ts
// Already wired in Phase A.4's TransactionListenerService:
// When ownership change is detected, it calls:
wsService.broadcastMarketplaceEvent({
  type: 'transfer',
  nftMint: mintAddress,
  collectionSlug: collectionSlug,
  from: previousOwner,
  to: newOwner,
  txSignature: '',
})

// In marketplace actions (ListNftAction, BuyNftAction, etc.):
// After successful DB update, broadcast the event:
import { wsService } from '../../Services/WebSocketService'

// Example in BuyNftAction — after purchase completes:
wsService.broadcastMarketplaceEvent({
  type: 'sale',
  nftMint: nft.mint_address,
  collectionSlug: collection.slug,
  price: listing.price,
  from: listing.seller_wallet,
  to: buyerWallet,
  txSignature: result.signature,
})
```

---

## Phase C: Compressed NFT (cNFT) Support

> **Why**: Compressed NFTs cost ~$0.0005 to mint vs ~$2 for regular NFTs. Large collections (10K+) save 99.9% on minting costs. Growing fast on Solana — if you don't support them, you're missing a significant and growing segment of the market.

### C.1 cNFT Detection & Display

- [ ] cNFTs are indexed at mint time via `indexerService.indexOnMint()` with `compressed: true`
- [ ] Display cNFTs identically to regular NFTs in the grid (users shouldn't care about the underlying standard)
- [ ] Add subtle "compressed" indicator in NFT detail page metadata section
- [ ] Store `tree_address` and `leaf_index` in DB for transfer operations

```ts
// cNFTs are already in our DB from minting — no external API needed
// The indexer stores compression data at mint time:

const nft = await db
  .selectFrom('nfts')
  .where('mint_address', '=', mintAddress)
  .selectAll()
  .executeTakeFirst()

// Same data shape regardless of compressed or regular
const nftData = {
  mint: nft.mint_address,
  name: nft.name,
  image: nft.image_url,
  owner: nft.owner_wallet,
  collection: nft.collection_id,
  attributes: JSON.parse(nft.attributes || '[]'),
  compressed: nft.is_compressed,
  // Compression-specific data needed for transfers
  tree: nft.tree_address,
  leafIndex: nft.leaf_index,
}
```

### C.2 cNFT Minting via Candy Machine

- [ ] Support Bubblegum-based minting through `ts-tokens`
- [ ] Merkle tree creation and management
- [ ] Batch mint support (mint 1000 cNFTs in a single transaction batch)

```ts
// app/Actions/CandyMachine/MintCompressedAction.ts

export async function handle(request: Request): Promise<Response> {
  const { candyMachine, wallet, quantity } = await request.json()

  // cNFT minting uses Bubblegum program under the hood
  // ts-tokens abstracts this — same interface, different program
  const results = await tokenService.mintCompressedNFT({
    candyMachine,
    buyer: wallet,
    quantity: quantity || 1,
    // Merkle tree must be pre-created with sufficient capacity
    merkleTree: await getCandyMachineMerkleTree(candyMachine),
  })

  return Response.json({
    success: true,
    minted: results.map(r => ({
      assetId: r.assetId,  // cNFTs use asset IDs, not mint addresses
      leafIndex: r.leafIndex,
      txSignature: r.signature,
    })),
  })
}
```

### C.3 cNFT Trading

- [ ] Support listing cNFTs for sale (different transfer instruction than regular NFTs)
- [ ] Support buying cNFTs (Bubblegum transfer)
- [ ] Merkle proof retrieval for cNFT operations

```ts
// cNFT transfers require the merkle proof
// Since we store the tree address and leaf index at mint time,
// we can reconstruct proofs from the on-chain merkle tree via RPC

import { ConcurrentMerkleTreeAccount } from '@solana/spl-account-compression'
import { Connection, PublicKey } from '@solana/web3.js'

async function getCNFTProof(nft: {
  tree_address: string
  leaf_index: number
  mint_address: string
}) {
  const connection = new Connection(process.env.RPC_URL!)
  const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
    connection,
    new PublicKey(nft.tree_address),
  )

  // Get the proof from the on-chain tree
  // For canopy-enabled trees, only the non-canopy portion needs to be provided
  const proof = await connection.getAssetProof(new PublicKey(nft.mint_address))

  return {
    root: treeAccount.getCurrentRoot(),
    proof: proof.proof,
    leafIndex: nft.leaf_index,
    treeId: nft.tree_address,
    canopyDepth: treeAccount.getCanopyDepth(),
  }
}
```

### C.4 Merkle Tree Management

- [ ] Create admin action for provisioning new merkle trees
- [ ] Monitor tree capacity (alert when >80% full)
- [ ] Auto-create new trees when capacity is low

```ts
// app/Actions/Admin/CreateMerkleTreeAction.ts

export async function handle(request: Request): Promise<Response> {
  const { maxDepth, maxBufferSize } = await request.json()

  // maxDepth determines capacity: 2^maxDepth leaves
  // maxDepth=20 = ~1M NFTs, maxDepth=14 = ~16K NFTs
  // Cost scales with depth — choose based on collection size

  const tree = await tokenService.createMerkleTree({
    maxDepth: maxDepth || 14,        // 16,384 NFTs
    maxBufferSize: maxBufferSize || 64,
    canopyDepth: 11,                 // Reduces proof size for cheaper transfers
  })

  return Response.json({
    success: true,
    treeAddress: tree.address,
    capacity: 2 ** (maxDepth || 14),
    estimatedCost: tree.cost,        // SOL cost for tree account rent
  })
}
```

---

## Phase D: Community-Owned Marketplace (Differentiator)

> **Why**: This is your moat. Neither Tensor nor Magic Eden can easily offer this because it conflicts with their centralized business model. The idea: marketplace fees flow back to the community via staking rewards and governance-directed treasury.

### D.1 Revenue Sharing via Staking

- [ ] Platform fees (currently 1%) are split: 50% to treasury, 50% to staking rewards pool
- [ ] Stakers earn proportional share of marketplace revenue
- [ ] Real-time revenue tracking dashboard

```ts
// app/Services/RevenueShareService.ts

class RevenueShareService {
  /**
   * Called after every successful sale on the marketplace
   * Splits the platform fee between treasury and staking rewards
   */
  async distributePlatformFee(saleEvent: {
    totalPrice: number     // SOL
    platformFee: number    // SOL (1% of totalPrice)
    txSignature: string
    collectionId: string
  }) {
    const { platformFee, collectionId } = saleEvent

    // 50/50 split between treasury and stakers
    const treasuryShare = platformFee * 0.5
    const stakingShare = platformFee * 0.5

    // Deposit to DAO treasury
    await this.depositToTreasury(collectionId, treasuryShare, saleEvent.txSignature)

    // Distribute to staking rewards pool
    await this.fundStakingRewards(collectionId, stakingShare, saleEvent.txSignature)

    // Record the distribution
    await db
      .insertInto('revenue_distributions')
      .values({
        collection_id: collectionId,
        total_fee: platformFee,
        treasury_share: treasuryShare,
        staking_share: stakingShare,
        tx_signature: saleEvent.txSignature,
        created_at: new Date(),
      })
      .execute()
  }

  /**
   * Get revenue stats for a collection's community
   */
  async getRevenueStats(collectionId: string, period: '24h' | '7d' | '30d' | 'all') {
    const since = this.periodToDate(period)

    const stats = await db
      .selectFrom('revenue_distributions')
      .where('collection_id', '=', collectionId)
      .where('created_at', '>=', since)
      .select([
        db.fn.sum('total_fee').as('totalFees'),
        db.fn.sum('treasury_share').as('totalTreasury'),
        db.fn.sum('staking_share').as('totalStakingRewards'),
        db.fn.count('id').as('salesCount'),
      ])
      .executeTakeFirst()

    return stats
  }

  private periodToDate(period: string): Date {
    const now = new Date()
    switch (period) {
      case '24h': return new Date(now.getTime() - 86400000)
      case '7d': return new Date(now.getTime() - 604800000)
      case '30d': return new Date(now.getTime() - 2592000000)
      default: return new Date(0)
    }
  }

  private async depositToTreasury(collectionId: string, amount: number, txSig: string) {
    // Transfer SOL to the DAO's treasury PDA
    // This is governed by the DAO — community votes on how to spend
  }

  private async fundStakingRewards(collectionId: string, amount: number, txSig: string) {
    // Add SOL to the staking rewards pool for this collection
    // Automatically distributed to stakers based on their stake weight
  }
}

export const revenueShareService = new RevenueShareService()
```

### D.2 Governance-Controlled Royalties

- [ ] Allow collection DAOs to vote on royalty percentage
- [ ] Allow DAOs to vote on treasury spending (marketing, airdrops, buybacks)
- [ ] Proposal templates for common governance actions

```ts
// Governance proposal types that make this marketplace unique:

interface RoyaltyProposal {
  type: 'change_royalty'
  currentRoyaltyBps: number    // e.g., 500 (5%)
  proposedRoyaltyBps: number   // e.g., 250 (2.5%)
  rationale: string
}

interface TreasurySpendProposal {
  type: 'treasury_spend'
  amount: number               // SOL
  recipient: string            // wallet address
  purpose: 'marketing' | 'development' | 'airdrop' | 'buyback' | 'other'
  description: string
}

interface FeeStructureProposal {
  type: 'change_fee_split'
  currentTreasurySplit: number  // e.g., 50 (50%)
  proposedTreasurySplit: number // e.g., 30 (30% treasury, 70% stakers)
  rationale: string
}

interface CurationProposal {
  type: 'curate_collection'
  collectionMint: string
  action: 'feature' | 'verify' | 'delist'
  rationale: string
}
```

### D.3 Community Curation

- [ ] Community votes on which collections get featured on homepage
- [ ] Community-driven verification badges (instead of centralized approval)
- [ ] Report system with community moderation

```ts
// app/Actions/Governance/CurationVoteAction.ts

export async function handle(request: Request): Promise<Response> {
  const { collectionMint, voterWallet, action } = await request.json()

  // Verify voter holds NFTs from the governance collection
  const holdings = await heliusService.getAssetsByOwner(voterWallet, {
    collection: GOVERNANCE_COLLECTION_MINT,
  })

  if (holdings.total === 0) {
    return Response.json({ error: 'Must hold a Hoodie NFT to vote' }, { status: 403 })
  }

  // Record curation vote (1 NFT = 1 vote)
  const votingPower = holdings.total

  await db
    .insertInto('curation_votes')
    .values({
      collection_mint: collectionMint,
      voter_wallet: voterWallet,
      action, // 'feature', 'verify', 'delist'
      voting_power: votingPower,
      created_at: new Date(),
    })
    .onConflict(oc => oc.columns(['collection_mint', 'voter_wallet']).doUpdateSet({
      action,
      voting_power: votingPower,
      created_at: new Date(),
    }))
    .execute()

  // Check if threshold reached for auto-action
  const totalVotes = await db
    .selectFrom('curation_votes')
    .where('collection_mint', '=', collectionMint)
    .where('action', '=', action)
    .select(db.fn.sum('voting_power').as('total'))
    .executeTakeFirst()

  const threshold = await getGovernanceThreshold(action)

  return Response.json({
    success: true,
    currentVotes: Number(totalVotes?.total || 0),
    threshold,
    passed: Number(totalVotes?.total || 0) >= threshold,
  })
}
```

### D.4 Revenue Dashboard Component

- [ ] Create revenue dashboard view showing community earnings
- [ ] Show individual staker's earned rewards from marketplace activity
- [ ] Historical charts of marketplace volume → community revenue

```html
<!-- resources/views/components/RevenueDashboard.stx -->
<!-- Displays how marketplace fees flow back to the community -->

<div class="revenue-dashboard">
  <h3>Community Revenue</h3>
  <p class="subtitle">Every trade on Hoodies generates revenue for the community</p>

  <div class="revenue-flow">
    <div class="flow-step">
      <span class="flow-label">Sale Happens</span>
      <span class="flow-value">{{ totalVolume }} SOL traded</span>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-step">
      <span class="flow-label">1% Platform Fee</span>
      <span class="flow-value">{{ totalFees }} SOL collected</span>
    </div>
    <div class="flow-arrow">&rarr;</div>
    <div class="flow-split">
      <div class="split-item">
        <span class="split-pct">50%</span>
        <span class="split-label">DAO Treasury</span>
        <span class="split-value">{{ treasuryBalance }} SOL</span>
        <span class="split-note">Community votes on spending</span>
      </div>
      <div class="split-item">
        <span class="split-pct">50%</span>
        <span class="split-label">Staking Rewards</span>
        <span class="split-value">{{ stakingRewards }} SOL</span>
        <span class="split-note">Distributed to NFT stakers</span>
      </div>
    </div>
  </div>

  <!-- Your personal earnings (if wallet connected) -->
  @if(walletConnected)
  <div class="your-earnings">
    <h4>Your Earnings</h4>
    <div class="earnings-grid">
      <div>
        <span class="label">Staked NFTs</span>
        <span class="value">{{ stakedCount }}</span>
      </div>
      <div>
        <span class="label">Pending Rewards</span>
        <span class="value">{{ pendingRewards }} SOL</span>
      </div>
      <div>
        <span class="label">Total Earned</span>
        <span class="value">{{ totalEarned }} SOL</span>
      </div>
    </div>
    <button onclick="claimRewards()" class="claim-btn">Claim Rewards</button>
  </div>
  @endif
</div>
```

---

## Phase E: Creator Launchpad & Tools

> **Why**: Creators bring their communities with them. A simple launchpad lets creators mint collections directly on Hoodies, driving organic traffic and new users. This is Magic Eden's biggest growth channel.

### E.1 Collection Creation Wizard

- [ ] Multi-step collection creation flow:
  1. Upload artwork (drag-and-drop with preview)
  2. Set metadata (name, description, symbol, attributes schema)
  3. Configure royalties and splits
  4. Set mint price and supply
  5. Configure allowlist / phases
  6. Deploy and launch
- [ ] Support both regular and compressed NFT collections

```ts
// app/Actions/Launchpad/CreateCollectionWizardAction.ts

interface LaunchpadConfig {
  // Step 1: Basic info
  name: string
  symbol: string
  description: string
  externalUrl?: string

  // Step 2: Collection settings
  supply: number
  useCompressed: boolean      // cNFT for cost savings
  sellerFeeBasisPoints: number // Royalty %

  // Step 3: Mint phases
  phases: Array<{
    name: string              // 'OG', 'Allowlist', 'Public'
    price: number             // SOL
    startDate: Date
    endDate?: Date
    maxPerWallet: number
    allowlist?: string[]      // wallet addresses (for merkle root)
  }>

  // Step 4: Revenue splits
  creators: Array<{
    address: string
    share: number             // percentage, must total 100
  }>
}

export async function handle(request: Request): Promise<Response> {
  const config: LaunchpadConfig = await request.json()

  // 1. Upload metadata to Arweave/IPFS via storage provider
  const metadataUri = await tokenService.uploadCollectionMetadata({
    name: config.name,
    symbol: config.symbol,
    description: config.description,
    externalUrl: config.externalUrl,
  })

  // 2. Create the collection on-chain
  const collection = await tokenService.createOnChainCollection({
    name: config.name,
    symbol: config.symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: config.sellerFeeBasisPoints,
    creators: config.creators,
  })

  // 3. Create candy machine with phases as guards
  const candyMachine = await tokenService.createCandyMachine({
    collection: collection.address,
    itemsAvailable: config.supply,
    isMutable: true,
  })

  // 4. Set up mint phases as guard groups
  for (const phase of config.phases) {
    const guards: Record<string, unknown> = {
      solPayment: {
        lamports: phase.price * 1e9,
        destination: config.creators[0].address,
      },
      startDate: { date: phase.startDate },
      mintLimit: { limit: phase.maxPerWallet },
    }

    if (phase.endDate) {
      guards.endDate = { date: phase.endDate }
    }

    if (phase.allowlist) {
      // Compute merkle root from allowlist
      guards.allowList = {
        merkleRoot: computeMerkleRoot(phase.allowlist),
      }
    }

    await tokenService.addGuards(candyMachine.address, guards, phase.name)
  }

  // 5. If using cNFTs, create merkle tree
  let merkleTree
  if (config.useCompressed) {
    const depth = Math.ceil(Math.log2(config.supply))
    merkleTree = await tokenService.createMerkleTree({
      maxDepth: Math.max(depth, 14),
      maxBufferSize: 64,
      canopyDepth: Math.min(depth - 3, 11),
    })
  }

  // 6. Store in database
  await db
    .insertInto('collections')
    .values({
      name: config.name,
      slug: slugify(config.name),
      mint_address: collection.address,
      candy_machine_address: candyMachine.address,
      merkle_tree_address: merkleTree?.address || null,
      supply: config.supply,
      is_compressed: config.useCompressed,
      seller_fee_basis_points: config.sellerFeeBasisPoints,
      status: 'pending',  // Requires community vote or admin approval
      created_at: new Date(),
    })
    .execute()

  return Response.json({
    success: true,
    collection: collection.address,
    candyMachine: candyMachine.address,
    merkleTree: merkleTree?.address,
    launchpadUrl: `/collections/${slugify(config.name)}`,
  })
}
```

### E.2 Creator Dashboard

- [ ] Create `creator-dashboard.stx` view for collection creators
- [ ] Real-time mint progress (minted / supply)
- [ ] Revenue tracking (primary sales + secondary royalties)
- [ ] Holder analytics (who holds, whale tracking)
- [ ] Metadata update tools (update collection image, description)

```html
<!-- resources/views/creator-dashboard.stx -->
@layout('default')
@section('title', 'Creator Dashboard | Hoodies')
@section('content')
  <div class="creator-dashboard">
    <h1>Creator Dashboard</h1>

    <!-- Collection selector -->
    <select id="collection-select" onchange="loadCollectionData(this.value)">
      @foreach(collections as collection)
        <option value="{{ collection.slug }}">{{ collection.name }}</option>
      @endforeach
    </select>

    <!-- Mint progress -->
    <div class="stat-card">
      <h3>Mint Progress</h3>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {{ (mintedCount / totalSupply) * 100 }}%"></div>
      </div>
      <span>{{ mintedCount }} / {{ totalSupply }} minted ({{ Math.round((mintedCount / totalSupply) * 100) }}%)</span>
    </div>

    <!-- Revenue -->
    <div class="revenue-grid">
      <div class="stat-card">
        <h4>Primary Sales</h4>
        <span class="big-number">{{ primaryRevenue }} SOL</span>
      </div>
      <div class="stat-card">
        <h4>Secondary Royalties</h4>
        <span class="big-number">{{ royaltyRevenue }} SOL</span>
      </div>
      <div class="stat-card">
        <h4>Total Revenue</h4>
        <span class="big-number">{{ primaryRevenue + royaltyRevenue }} SOL</span>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="actions-row">
      <button onclick="openMetadataEditor()">Edit Metadata</button>
      <button onclick="openAirdropTool()">Airdrop</button>
      <button onclick="exportHolders()">Export Holders CSV</button>
      <button onclick="openRoyaltySettings()">Royalty Settings</button>
    </div>
  </div>
@endsection
```

### E.3 Royalty Analytics for Creators

- [ ] Track where royalties come from (which marketplace, which trader)
- [ ] Royalty compliance rate (% of sales that paid royalties)
- [ ] Historical royalty income chart

```ts
// app/Actions/Creator/RoyaltyAnalyticsAction.ts

export async function handle(request: Request): Promise<Response> {
  const { collectionId, period } = request.params

  const since = periodToDate(period || '30d')

  // Sales with royalty data
  const sales = await db
    .selectFrom('marketplace_events')
    .where('collection_id', '=', collectionId)
    .where('type', '=', 'sale')
    .where('created_at', '>=', since)
    .select([
      'price',
      'royalty_paid',
      'source',           // 'hoodies', 'tensor', 'magic_eden'
      'tx_signature',
      'created_at',
    ])
    .orderBy('created_at', 'desc')
    .execute()

  const totalSales = sales.length
  const totalVolume = sales.reduce((sum, s) => sum + Number(s.price), 0)
  const totalRoyalties = sales.reduce((sum, s) => sum + Number(s.royalty_paid || 0), 0)
  const salesWithRoyalty = sales.filter(s => Number(s.royalty_paid) > 0).length
  const complianceRate = totalSales > 0 ? (salesWithRoyalty / totalSales) * 100 : 0

  // Breakdown by marketplace source
  const bySource = sales.reduce((acc, s) => {
    const source = s.source || 'unknown'
    if (!acc[source]) acc[source] = { sales: 0, volume: 0, royalties: 0 }
    acc[source].sales++
    acc[source].volume += Number(s.price)
    acc[source].royalties += Number(s.royalty_paid || 0)
    return acc
  }, {} as Record<string, { sales: number, volume: number, royalties: number }>)

  return Response.json({
    totalSales,
    totalVolume,
    totalRoyalties,
    complianceRate,
    bySource,
    // Daily breakdown for charts
    daily: aggregateByDay(sales),
  })
}
```

---

## Phase F: Liquidity Bootstrap & Aggregation

> **Why**: The #1 problem for any new marketplace is liquidity. Show inventory from day one by aggregating Tensor and Magic Eden listings. Incentivize early traders to build organic volume.

### F.1 Tensor Listing Aggregation

- [ ] Fetch active Tensor listings for tracked collections
- [ ] Display Tensor listings alongside native listings in the NFT grid
- [ ] "Buy on Tensor" redirect for external listings
- [ ] Show "best price" badge comparing across marketplaces

```ts
// app/Services/TensorAggregatorService.ts

class TensorAggregatorService {
  private apiUrl = 'https://api.tensor.so/graphql'

  /**
   * Fetch active listings from Tensor for a collection
   */
  async getCollectionListings(collectionSlug: string, options: {
    limit?: number
    sortBy?: 'PriceAsc' | 'PriceDesc' | 'ListedDesc'
  } = {}): Promise<TensorListing[]> {
    const query = `
      query ActiveListings($slug: String!, $limit: Int, $sortBy: ActiveListingsSortBy) {
        activeListings(slug: $slug, sortBy: $sortBy, limit: $limit) {
          txs {
            tx {
              grossAmount
              grossAmountUnit
              sellerId
              source
            }
            mint {
              onchainId
              name
              imageUri
              rarityRankHR
            }
          }
        }
      }
    `

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TENSOR-API-KEY': process.env.TENSOR_API_KEY || '',
      },
      body: JSON.stringify({
        query,
        variables: {
          slug: collectionSlug,
          limit: options.limit || 100,
          sortBy: options.sortBy || 'PriceAsc',
        },
      }),
    })

    const { data } = await response.json()

    return (data?.activeListings?.txs || []).map((item: any) => ({
      mint: item.mint.onchainId,
      name: item.mint.name,
      image: item.mint.imageUri,
      price: item.tx.grossAmount / 1e9,  // lamports to SOL
      seller: item.tx.sellerId,
      source: 'tensor',
      rarityRank: item.mint.rarityRankHR,
    }))
  }

  /**
   * Get floor price comparison across marketplaces
   */
  async getFloorComparison(collectionSlug: string): Promise<{
    hoodies: number | null
    tensor: number | null
    magicEden: number | null
    bestPrice: { price: number, source: string }
  }> {
    const [tensorListings, hoodiesFloor] = await Promise.all([
      this.getCollectionListings(collectionSlug, { limit: 1, sortBy: 'PriceAsc' }),
      this.getHoodiesFloor(collectionSlug),
    ])

    const tensorFloor = tensorListings[0]?.price || null
    const prices = [
      tensorFloor && { price: tensorFloor, source: 'tensor' },
      hoodiesFloor && { price: hoodiesFloor, source: 'hoodies' },
    ].filter(Boolean) as Array<{ price: number, source: string }>

    prices.sort((a, b) => a.price - b.price)

    return {
      hoodies: hoodiesFloor,
      tensor: tensorFloor,
      magicEden: null,  // Add ME API integration later
      bestPrice: prices[0] || { price: 0, source: 'none' },
    }
  }

  private async getHoodiesFloor(slug: string): Promise<number | null> {
    const result = await db
      .selectFrom('nfts')
      .innerJoin('collections', 'collections.id', 'nfts.collection_id')
      .where('collections.slug', '=', slug)
      .where('nfts.status', '=', 'listed')
      .orderBy('nfts.listing_price', 'asc')
      .select('nfts.listing_price')
      .limit(1)
      .executeTakeFirst()

    return result?.listing_price ? Number(result.listing_price) : null
  }
}

interface TensorListing {
  mint: string
  name: string
  image: string
  price: number
  seller: string
  source: 'tensor'
  rarityRank?: number
}

export const tensorAggregator = new TensorAggregatorService()
```

### F.2 Trading Rewards Program

- [ ] Points system for marketplace activity
- [ ] Reward tiers: trade volume → point multipliers
- [ ] Leaderboard page
- [ ] Future: convert points to governance tokens

```ts
// app/Services/TradingRewardsService.ts

class TradingRewardsService {
  // Points per action
  private readonly POINTS = {
    buy: 100,          // per SOL spent
    sell: 50,          // per SOL received
    list: 10,          // per listing
    offer: 5,          // per offer made
    referral: 200,     // per referred user's first trade
  }

  // Multiplier tiers based on 30d volume
  private readonly TIERS = [
    { name: 'Bronze', minVolume: 0, multiplier: 1 },
    { name: 'Silver', minVolume: 10, multiplier: 1.5 },
    { name: 'Gold', minVolume: 50, multiplier: 2 },
    { name: 'Diamond', minVolume: 200, multiplier: 3 },
  ]

  async recordActivity(wallet: string, action: keyof typeof this.POINTS, solAmount: number = 1) {
    const basePoints = this.POINTS[action] * solAmount
    const tier = await this.getUserTier(wallet)
    const points = Math.floor(basePoints * tier.multiplier)

    await db
      .insertInto('trading_rewards')
      .values({
        wallet,
        action,
        points,
        sol_amount: solAmount,
        multiplier: tier.multiplier,
        season: this.getCurrentSeason(),
        created_at: new Date(),
      })
      .execute()

    return { points, tier: tier.name, totalPoints: await this.getTotalPoints(wallet) }
  }

  async getLeaderboard(season?: string, limit = 50) {
    return db
      .selectFrom('trading_rewards')
      .where('season', '=', season || this.getCurrentSeason())
      .groupBy('wallet')
      .select([
        'wallet',
        db.fn.sum('points').as('total_points'),
        db.fn.count('id').as('trade_count'),
      ])
      .orderBy('total_points', 'desc')
      .limit(limit)
      .execute()
  }

  private async getUserTier(wallet: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    const volume = await db
      .selectFrom('marketplace_events')
      .where('from_wallet', '=', wallet)
      .where('type', '=', 'sale')
      .where('created_at', '>=', thirtyDaysAgo)
      .select(db.fn.sum('price').as('volume'))
      .executeTakeFirst()

    const vol = Number(volume?.volume || 0)
    return [...this.TIERS].reverse().find(t => vol >= t.minVolume) || this.TIERS[0]
  }

  private getCurrentSeason(): string {
    const now = new Date()
    return `${now.getFullYear()}-S${Math.ceil((now.getMonth() + 1) / 3)}`
  }

  private async getTotalPoints(wallet: string): Promise<number> {
    const result = await db
      .selectFrom('trading_rewards')
      .where('wallet', '=', wallet)
      .where('season', '=', this.getCurrentSeason())
      .select(db.fn.sum('points').as('total'))
      .executeTakeFirst()

    return Number(result?.total || 0)
  }
}

export const tradingRewards = new TradingRewardsService()
```

### F.3 Referral System

- [ ] Generate unique referral links per wallet
- [ ] Track referral conversions (sign-up → first trade)
- [ ] Reward referrer with bonus points
- [ ] Reward referee with fee discount on first trade

```ts
// Referral link format: /ref/{wallet_short_hash}
// Cookie-based tracking for 30 days

async function handleReferral(referralCode: string, newWallet: string) {
  const referrer = await db
    .selectFrom('referral_codes')
    .where('code', '=', referralCode)
    .select('wallet')
    .executeTakeFirst()

  if (!referrer) return

  await db
    .insertInto('referrals')
    .values({
      referrer_wallet: referrer.wallet,
      referee_wallet: newWallet,
      status: 'signed_up',
      created_at: new Date(),
    })
    .execute()
}
```

---

## Phase G: MEV Protection & Transaction Optimization

> **Why**: Users losing transactions to sandwich attacks or paying too much in fees is a churn killer. Priority fee estimation prevents dropped transactions. Jito bundles protect high-value trades from MEV.

### G.1 Priority Fee Estimation

- [ ] Fetch recent priority fees from RPC
- [ ] Suggest optimal priority fee based on network congestion
- [ ] Three-tier fee suggestions: economy, standard, fast

```ts
// app/Services/PriorityFeeService.ts

class PriorityFeeService {
  /**
   * Get recommended priority fees based on recent blocks
   * Returns fees in microlamports per compute unit
   */
  async getRecommendedFees(): Promise<{
    economy: number
    standard: number
    fast: number
    networkCongestion: 'low' | 'medium' | 'high'
  }> {
    const response = await fetch(process.env.RPC_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getRecentPrioritizationFees',
        params: [],
      }),
    })

    const { result } = await response.json()

    // Sort by fee level
    const fees = result
      .map((r: any) => r.prioritizationFee)
      .sort((a: number, b: number) => a - b)

    const len = fees.length

    // Percentile-based recommendations
    const economy = fees[Math.floor(len * 0.25)] || 1000    // 25th percentile
    const standard = fees[Math.floor(len * 0.50)] || 5000   // 50th percentile
    const fast = fees[Math.floor(len * 0.75)] || 50000      // 75th percentile

    // Determine congestion level
    const medianFee = fees[Math.floor(len * 0.5)] || 0
    let congestion: 'low' | 'medium' | 'high' = 'low'
    if (medianFee > 50000) congestion = 'high'
    else if (medianFee > 10000) congestion = 'medium'

    return { economy, standard, fast, networkCongestion: congestion }
  }

  /**
   * Add priority fee instruction to a transaction
   */
  addPriorityFee(transaction: any, feeLevel: 'economy' | 'standard' | 'fast' = 'standard') {
    // ts-tokens should support this via transaction builder
    return tokenService.withPriorityFee(transaction, feeLevel)
  }
}

export const priorityFeeService = new PriorityFeeService()
```

### G.2 Jito Bundle Support

- [ ] Submit high-value transactions via Jito for MEV protection
- [ ] Tip Jito validators for inclusion
- [ ] Configurable threshold (e.g., use Jito for trades > 10 SOL)

```ts
// app/Services/JitoService.ts

class JitoService {
  private blockEngineUrl = 'https://mainnet.block-engine.jito.wtf'

  /**
   * Submit a transaction bundle via Jito for MEV protection
   * Transactions in a bundle are executed atomically and privately
   */
  async submitBundle(transactions: string[], tipLamports: number = 10000): Promise<string> {
    // Create tip transaction to Jito validator
    const tipAccounts = await this.getTipAccounts()
    const tipAccount = tipAccounts[Math.floor(Math.random() * tipAccounts.length)]

    const response = await fetch(`${this.blockEngineUrl}/api/v1/bundles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sendBundle',
        params: [
          transactions, // Array of base58 encoded signed transactions
          { encoding: 'base58' },
        ],
      }),
    })

    const { result } = await response.json()
    return result // bundle ID
  }

  /**
   * Check bundle status
   */
  async getBundleStatus(bundleId: string) {
    const response = await fetch(`${this.blockEngineUrl}/api/v1/bundles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBundleStatuses',
        params: [[bundleId]],
      }),
    })

    const { result } = await response.json()
    return result?.value?.[0]
  }

  private async getTipAccounts(): Promise<string[]> {
    const response = await fetch(`${this.blockEngineUrl}/api/v1/bundles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTipAccounts',
        params: [],
      }),
    })

    const { result } = await response.json()
    return result
  }
}

export const jitoService = new JitoService()
```

### G.3 Transaction Optimizer

- [ ] Automatically choose between regular RPC and Jito based on trade value
- [ ] Compute unit optimization (estimate actual CU usage, don't overpay)
- [ ] Retry logic with priority fee escalation

```ts
// Integrated in BuyNftAction / batch operations:

async function submitOptimizedTransaction(
  transaction: any,
  options: { value: number, wallet: string },
) {
  const USE_JITO_THRESHOLD = 10 // SOL

  if (options.value >= USE_JITO_THRESHOLD) {
    // High-value trade — use Jito for MEV protection
    console.log(`Trade value ${options.value} SOL — using Jito bundle`)
    const bundleId = await jitoService.submitBundle([transaction])
    return { method: 'jito', bundleId }
  }

  // Standard trade — use priority fees
  const fees = await priorityFeeService.getRecommendedFees()
  const txWithFee = priorityFeeService.addPriorityFee(transaction, 'standard')

  return {
    method: 'rpc',
    priorityFee: fees.standard,
    transaction: txWithFee,
  }
}
```

---

## Phase H: Image CDN & Media Pipeline

> **Why**: NFT images are often hosted on Arweave or IPFS, which are slow. A CDN with on-the-fly resizing dramatically improves page load times and reduces bandwidth.

### H.1 Image Proxy Service

- [ ] Create image proxy endpoint that caches and resizes NFT images
- [ ] Support multiple source formats (Arweave, IPFS, HTTP)
- [ ] Generate multiple sizes: thumbnail (150px), card (400px), detail (800px), full

```ts
// app/Actions/Media/ImageProxyAction.ts

export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const imageUrl = url.searchParams.get('url')
  const width = parseInt(url.searchParams.get('w') || '400')
  const quality = parseInt(url.searchParams.get('q') || '80')
  const format = url.searchParams.get('f') || 'webp'

  if (!imageUrl) {
    return new Response('Missing url param', { status: 400 })
  }

  // Validate URL (prevent SSRF)
  const allowedHosts = [
    'arweave.net',
    'www.arweave.net',
    'ipfs.io',
    'gateway.pinata.cloud',
    'nftstorage.link',
    'shdw-drive.genesysgo.net',
  ]

  const sourceUrl = new URL(imageUrl)
  if (!allowedHosts.some(h => sourceUrl.hostname.endsWith(h))) {
    return new Response('Image host not allowed', { status: 403 })
  }

  // Check cache first
  const cacheKey = `img:${imageUrl}:${width}:${quality}:${format}`
  const cached = await cacheService.get(cacheKey)
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=86400',
        'CDN-Cache-Control': 'public, max-age=604800',
      },
    })
  }

  // Fetch and transform
  const imageResponse = await fetch(imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()

  // Use sharp for resizing (Bun supports sharp)
  const sharp = (await import('sharp')).default
  const resized = await sharp(Buffer.from(imageBuffer))
    .resize(width, width, { fit: 'cover' })
    .toFormat(format as any, { quality })
    .toBuffer()

  // Cache for 24 hours
  await cacheService.set(cacheKey, resized, 86400)

  return new Response(resized, {
    headers: {
      'Content-Type': `image/${format}`,
      'Cache-Control': 'public, max-age=86400',
      'CDN-Cache-Control': 'public, max-age=604800',
    },
  })
}
```

### H.2 Image URL Helper

- [ ] Create helper function to generate CDN URLs from raw image URIs
- [ ] Use in all STX views and API responses

```ts
// app/Actions/helpers.ts — add to existing helpers

/**
 * Convert a raw NFT image URL to a CDN-proxied URL with resizing
 *
 * Usage in STX views:
 *   <img src="{{ cdnImage(nft.image, 400) }}" />
 *
 * Generates: /api/media/image?url=https://arweave.net/abc&w=400&f=webp
 */
export function cdnImage(url: string, width: number = 400, format: string = 'webp'): string {
  if (!url) return '/assets/images/placeholder-nft.png'

  // If already a local/CDN URL, return as-is
  if (url.startsWith('/')) return url

  return `/api/media/image?url=${encodeURIComponent(url)}&w=${width}&f=${format}`
}

// Preset sizes
export const imageSizes = {
  thumbnail: (url: string) => cdnImage(url, 150),
  card: (url: string) => cdnImage(url, 400),
  detail: (url: string) => cdnImage(url, 800),
  full: (url: string) => cdnImage(url, 1200),
}
```

### H.3 Lazy Loading & Blur Placeholders

- [ ] Generate tiny (20px) blur hash placeholders for instant grid render
- [ ] Use native `loading="lazy"` on all NFT images
- [ ] Intersection Observer for progressive loading

```html
<!-- NFT card image with blur placeholder -->
<div class="nft-image-wrapper">
  <img
    src="{{ cdnImage(nft.image, 400) }}"
    alt="{{ nft.name }}"
    loading="lazy"
    decoding="async"
    style="background: {{ nft.dominantColor || '#1a1725' }}"
    onerror="this.src='/assets/images/placeholder-nft.png'"
  />
</div>
```

---

## Phase I: Priority Fee Estimation

> Already covered in Phase G.1. This section adds the **UI component** for fee selection.

### I.1 Fee Selector Component

- [ ] Show fee options before transaction signing
- [ ] Display estimated confirmation time per tier
- [ ] Show current network congestion indicator

```html
<!-- resources/views/components/FeeSelector.stx -->

<div class="fee-selector" id="fee-selector">
  <div class="fee-header">
    <span>Network Fee</span>
    <span class="congestion-badge" id="congestion-badge">Low</span>
  </div>

  <div class="fee-options">
    <label class="fee-option">
      <input type="radio" name="fee" value="economy" />
      <div class="fee-details">
        <span class="fee-name">Economy</span>
        <span class="fee-time">~30s</span>
        <span class="fee-cost" id="fee-economy">0.000005 SOL</span>
      </div>
    </label>

    <label class="fee-option selected">
      <input type="radio" name="fee" value="standard" checked />
      <div class="fee-details">
        <span class="fee-name">Standard</span>
        <span class="fee-time">~12s</span>
        <span class="fee-cost" id="fee-standard">0.00005 SOL</span>
      </div>
    </label>

    <label class="fee-option">
      <input type="radio" name="fee" value="fast" />
      <div class="fee-details">
        <span class="fee-name">Fast</span>
        <span class="fee-time">~5s</span>
        <span class="fee-cost" id="fee-fast">0.0005 SOL</span>
      </div>
    </label>
  </div>
</div>

<script>
  async function loadFeeEstimates() {
    const res = await fetch('/api/fees/estimate')
    const fees = await res.json()

    document.getElementById('fee-economy').textContent = `${(fees.economy / 1e6).toFixed(6)} SOL`
    document.getElementById('fee-standard').textContent = `${(fees.standard / 1e6).toFixed(6)} SOL`
    document.getElementById('fee-fast').textContent = `${(fees.fast / 1e6).toFixed(6)} SOL`

    const badge = document.getElementById('congestion-badge')
    badge.textContent = fees.networkCongestion.charAt(0).toUpperCase() + fees.networkCongestion.slice(1)
    badge.className = `congestion-badge congestion-${fees.networkCongestion}`
  }

  loadFeeEstimates()
  setInterval(loadFeeEstimates, 30000) // refresh every 30s
</script>
```

---

## Phase J: Remaining TODO Gaps

> **Why**: These are items from the original TODO.md that were left unchecked. Grouped here for convenience.

### J.1 Missing Database Tables & Columns

- [ ] `marketplace_events` table (Phase 11.6)
- [ ] `collection_stats_snapshots` table (Phase 11.6)
- [ ] `staking_pools`, `stakes`, `staking_rewards` tables (Phase 14.2)
- [ ] `daos`, `proposals`, `votes`, `treasury_transactions` tables (Phase 15.2)
- [ ] Auction columns: `min_bid_increment`, `reserve_price`, `anti_snipe_minutes`, `price_curve` (Phase 10.4)
- [ ] Indexes on `auctions` by `status` + `ends_at`

### J.2 Missing Background Jobs

- [ ] Auto-expire offers (Phase 9)
- [ ] Auto-settle ended auctions (Phase 10)
- [ ] Snapshot collection stats hourly (Phase 11)
- [ ] Anti-sniping extension on last-minute bids (Phase 10)

```ts
// app/Jobs/ExpireOffersJob.ts
// Run every minute via cron

export async function handle() {
  const expired = await db
    .updateTable('offers')
    .set({ status: 'expired' })
    .where('status', '=', 'active')
    .where('expires_at', '<=', new Date())
    .returning(['id', 'offerer_wallet', 'amount'])
    .execute()

  // Refund escrowed funds for expired offers
  for (const offer of expired) {
    await tokenService.refundEscrow(offer.offerer_wallet, offer.amount)
  }

  console.log(`Expired ${expired.length} offers`)
}
```

```ts
// app/Jobs/SettleAuctionsJob.ts
// Run every minute via cron

export async function handle() {
  const endedAuctions = await db
    .selectFrom('auctions')
    .where('status', '=', 'active')
    .where('ends_at', '<=', new Date())
    .selectAll()
    .execute()

  for (const auction of endedAuctions) {
    const highestBid = await db
      .selectFrom('bids')
      .where('auction_id', '=', auction.id)
      .orderBy('amount', 'desc')
      .limit(1)
      .selectAll()
      .executeTakeFirst()

    if (highestBid && Number(highestBid.amount) >= Number(auction.reserve_price || 0)) {
      // Transfer NFT to winner, release funds to seller
      await tokenService.settleAuction({
        auctionId: auction.id,
        winner: highestBid.bidder_wallet,
        seller: auction.seller_wallet,
        nftMint: auction.nft_mint,
        amount: highestBid.amount,
      })

      await db
        .updateTable('auctions')
        .set({ status: 'settled' })
        .where('id', '=', auction.id)
        .execute()
    } else {
      // Reserve not met or no bids — return NFT to seller
      await db
        .updateTable('auctions')
        .set({ status: 'failed' })
        .where('id', '=', auction.id)
        .execute()
    }
  }
}
```

### J.3 Missing UI Features

- [ ] Price history chart on NFT detail page (Phase 8.2)
- [ ] Edit listing price without delisting (Phase 9.1)
- [ ] Sorting dropdown on collection page (Phase 13.3)
- [ ] Owner filter on collection page (Phase 13.2)
- [ ] Quick action buttons on profile tabs (Phase 12.3)
- [ ] Watchlist/favorites (Phase 12.4)
- [ ] Staking history table (Phase 14.3)
- [ ] "Staked" badge on NFT cards (Phase 14.3)
- [ ] Listing source badges on NFT cards (Phase 17.1)
- [ ] "Buy at Best Price" button (Phase 17.2)
- [ ] Swap widget for buying SOL (Phase 16.1)
- [ ] "Buy with USDC" option (Phase 16.1)
- [ ] Token-gated access (Phase 16.2)

### J.4 Missing API Endpoints

- [ ] `GET /marketplace/activity` — global activity feed (Phase 11.7)
- [ ] `GET /marketplace/collections/{slug}/activity` — collection-scoped feed (Phase 11.7)
- [ ] `GET /staking/my-stakes` — user's active stakes (Phase 14.5)

### J.5 Security Gaps

- [ ] CSRF protection on POST endpoints (Phase 18.3)
- [ ] Request body size limits (Phase 18.3)
- [ ] Phishing detection on wallet interactions (Phase 18.4)
- [ ] Admin wallet allowlist check (Phase 18.5)
- [ ] Multi-sig for treasury withdrawals (Phase 18.5)
- [ ] Anomalous activity alerts (Phase 18.5)

---

## Phase K: Testing & Quality Assurance

> **Why**: Phase 22 from the original TODO is incomplete. Comprehensive testing prevents regressions as you build the improvements above.

### K.1 Integration Tests for New Services

- [ ] IndexerService tests (mint indexing, ownership sync, search, trait filtering)
- [ ] TransactionListenerService tests (account change detection)
- [ ] WebSocket service tests (connection, subscription, broadcast)
- [ ] RevenueShareService tests (fee splitting math)
- [ ] TensorAggregatorService tests (listing parsing)
- [ ] PriorityFeeService tests (fee estimation)

```ts
// tests/services/IndexerService.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { IndexerService } from '../../app/Services/IndexerService'
import { db } from '@stacksjs/database'

describe('IndexerService', () => {
  beforeEach(async () => {
    // Clean test data
    await db.deleteFrom('nft_traits').execute()
    await db.deleteFrom('nfts').where('name', 'like', 'Test%').execute()
  })

  it('should index an NFT at mint time', async () => {
    const service = new IndexerService()

    await service.indexOnMint({
      mint: 'TEST_MINT_ABC',
      name: 'Test Hoodie #1',
      symbol: 'HOOD',
      uri: 'https://arweave.net/test',
      owner: 'WALLET_123',
      collectionId: 1,
      attributes: [
        { trait_type: 'Background', value: 'Purple' },
        { trait_type: 'Hat', value: 'Crown' },
      ],
      image: 'https://arweave.net/test-image.png',
    })

    // Verify NFT was stored
    const nft = await db
      .selectFrom('nfts')
      .where('mint_address', '=', 'TEST_MINT_ABC')
      .selectAll()
      .executeTakeFirst()

    expect(nft).toBeTruthy()
    expect(nft!.name).toBe('Test Hoodie #1')
    expect(nft!.owner_wallet).toBe('WALLET_123')

    // Verify traits were indexed
    const traits = await db
      .selectFrom('nft_traits')
      .where('mint_address', '=', 'TEST_MINT_ABC')
      .selectAll()
      .execute()

    expect(traits.length).toBe(2)
    expect(traits.find(t => t.trait_type === 'Hat')?.trait_value).toBe('Crown')
  })

  it('should search NFTs with trait filters', async () => {
    const service = new IndexerService()

    // Index two NFTs with different traits
    await service.indexOnMint({
      mint: 'MINT_A', name: 'Test A', symbol: 'T', uri: '', owner: 'W1',
      collectionId: 1, attributes: [{ trait_type: 'Hat', value: 'Crown' }],
    })
    await service.indexOnMint({
      mint: 'MINT_B', name: 'Test B', symbol: 'T', uri: '', owner: 'W2',
      collectionId: 1, attributes: [{ trait_type: 'Hat', value: 'Beanie' }],
    })

    // Search with trait filter
    const results = await service.searchNFTs('', {
      collectionId: 1,
      traits: { Hat: ['Crown'] },
    })

    expect(results.length).toBe(1)
    expect(results[0].mint_address).toBe('MINT_A')
  })
})
```

### K.2 E2E Trading Flow Tests

- [ ] Full buy flow: list → buy → verify ownership change
- [ ] Full offer flow: make offer → accept → verify transfer
- [ ] Full auction flow: create → bid → settle → verify
- [ ] cNFT mint → list → buy flow
- [ ] Cross-marketplace listing flow

### K.3 Load Testing

- [ ] WebSocket connection limit testing (target: 10K concurrent)
- [ ] API endpoint response time benchmarks (target: <200ms p95)
- [ ] Database query performance under load
- [ ] Image proxy cache hit rate optimization

---

## Recommended Implementation Order

> Ordered by impact and dependency chain. Each phase builds on the previous.

| Priority | Phase | Effort | Impact | Why This Order |
|----------|-------|--------|--------|----------------|
| 1 | **A: Self-Hosted Indexer** | 1 week | Critical | Foundation for everything else. Zero external API costs. Unlocks fast queries, real-time sync, cNFT tracking |
| 2 | **B: WebSockets** | 3-4 days | High | Uses indexer events from Phase A. Makes the platform feel alive |
| 3 | **H: Image CDN** | 2 days | High | Quick win. Dramatically improves perceived performance |
| 4 | **I: Priority Fees** | 1-2 days | High | Quick win. Prevents dropped transactions, builds trust |
| 5 | **C: cNFT Support** | 3-4 days | High | Indexer already stores compression data. Opens large new market |
| 6 | **J: TODO Gaps** | 1 week | Medium | Fill holes in existing features before adding new ones |
| 7 | **D: Community-Owned** | 1-2 weeks | Critical (Strategic) | The differentiator. Revenue sharing, governance curation |
| 8 | **G: MEV Protection** | 3-4 days | Medium | Protects high-value trades. Builds trust with power traders |
| 9 | **E: Creator Launchpad** | 1-2 weeks | High | Drives organic growth through creator communities |
| 10 | **F: Liquidity Bootstrap** | 1 week | High | Trading rewards + aggregation. Do after core features are solid |
| 11 | **K: Testing** | Ongoing | Critical | Run alongside all other phases. Don't ship untested code |

### Quick Wins (can be done anytime, < 1 day each)

- Image CDN proxy (Phase H)
- Priority fee estimation API (Phase G.1 / I)
- Fee selector component (Phase I.1)
- Trading rewards point recording (Phase F.2 — backend only)

### Long-Term Differentiators

- Community-owned marketplace with revenue sharing (Phase D)
- Creator launchpad with governance-controlled curation (Phase E + D.3)
- Trading rewards → governance token pipeline (Phase F.2)
