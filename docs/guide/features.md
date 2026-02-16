# Features

Naked NFTs is a full-featured Solana NFT marketplace. Here's everything it can do.

## Browsing & Discovery

### Collections

The marketplace organizes NFTs into collections. Each collection has its own page with:

- **Collection details** — name, description, image, creator info
- **Stats** — floor price, total volume, number of items, number of owners
- **NFT grid** — browse all NFTs in the collection
- **Activity feed** — recent mints, sales, offers, and auctions

Visit `/marketplace/collections` to see all collections, or `/marketplace/collections/{slug}` for a specific one.

### Rarity

Every collection has rarity rankings calculated from trait distribution. View rarity data at `/marketplace/rarity/{slug}` to see how rare each NFT is within its collection.

### Activity Feed

A global activity feed at `/marketplace/activity` shows recent marketplace events across all collections — mints, listings, sales, offers, and auction activity. Filter by collection with `/marketplace/activity/{collectionSlug}`.

### User Profiles

View any wallet's NFT portfolio at `/marketplace/profile/{walletAddress}`, including owned NFTs, listing history, and offer activity.

---

## Minting

### Candy Machine Minting

Collections use **candy machines** for controlled minting. A candy machine defines:

- How many NFTs can be minted
- The mint price
- Start and end dates
- Guard conditions (token gates, allowlists, etc.)

Visit a collection's mint page at `/collections/mint/{slug}` to mint. The page shows live progress (minted/remaining), price, and a mint button that builds a transaction for your wallet to sign.

### Presales

Creators can set up presale periods with:

- Wallet allowlists (who can mint early)
- Discounted pricing (set in basis points, e.g. 500 = 5% off)
- Custom start/end times before the public mint

Check eligibility at `/presale/check-eligibility`.

### Quick Mint

For one-off NFTs (not part of a candy machine), use **Quick Mint**. Provide a name, optional metadata URI, and optional collection — and mint a single NFT directly. Available to authenticated users at `POST /mint/quick`.

---

## Secondary Market

Once NFTs are minted, they can be traded on the secondary market.

### Listing & Buying

- **List an NFT** — set your price and list it for sale
- **Buy an NFT** — purchase a listed NFT at the asking price
- **Delist** — remove your listing at any time

### Offers

- **Make an offer** — bid on any NFT, even if it's not listed
- **Accept an offer** — the NFT owner can accept and complete the sale
- **Cancel an offer** — withdraw your offer before it's accepted

### Auctions

- **Create an auction** — set a starting price, reserve price, and duration
- **Place bids** — each bid must be higher than the current highest
- **Settle** — after the auction ends, settle to transfer the NFT to the winner
- **Cancel** — cancel an active auction if no bids meet the reserve

### Escrow

For high-value trades, escrow provides an extra layer of security:

- **Create escrow** — lock the NFT and payment in escrow
- **Settle** — both parties confirm, funds and NFT are released
- **Cancel** — either party can cancel before settlement

### Platform Fee

A **1% platform fee** is automatically applied to all sales (buy, accept offer, settle auction, settle escrow). The fee is split from the sale amount before the seller receives payment. Configurable via environment variables.

---

## Authentication

### Wallet Login

The primary authentication method. No email or password required.

**How it works:**

1. Click "Connect Wallet" in the header
2. Your Solana wallet (Phantom, Solflare, etc.) opens
3. The marketplace generates a challenge message
4. You sign the message with your wallet
5. The server verifies your signature and issues a JWT token
6. You're logged in — the JWT is used for all authenticated requests

### Token Management

Authenticated users can:

- View active sessions at `GET /auth/tokens`
- Create API tokens at `POST /auth/token`
- Revoke tokens at `DELETE /auth/tokens/{id}`
- Refresh expired tokens at `POST /auth/refresh`

---

## Multi-Signature

For shared ownership or team-managed assets, multi-sig lets multiple wallets control an NFT or token.

### Creating a Multi-Sig

Set up a multi-sig account with:

- **Signers** — list of wallet addresses (minimum 2)
- **Threshold** — how many signatures are needed (e.g. 2-of-3)
- **Target mint** — the NFT or token this multi-sig controls

### Transaction Flow

1. **Propose** — any signer proposes a transaction (list, sell, transfer, update metadata)
2. **Sign** — other signers review and add their signatures
3. **Execute** — once the threshold is met, any signer can execute
4. **Cancel** — the proposer can cancel before execution

All multi-sig operations require authentication. Manage them at `/multisig`.

---

## Admin Dashboard

The admin dashboard at `/admin` provides management tools for authorized wallets.

### Tabs

| Tab | What it does |
|-----|-------------|
| **Collections** | View all collections, stats, and manage metadata |
| **Candy Machines** | Create and configure candy machines, add config lines, manage guards |
| **Presales** | Create and manage presale periods with allowlists |
| **NFTs** | Browse all NFTs, view details and ownership |
| **Minting** | Monitor mint progress and transaction history |
| **Fee Stats** | View platform fee revenue, recent transactions |
| **NFT Edit** | Update NFT metadata (name, URI, royalties) |
| **Bulk Upload** | Create up to 100 NFTs at once via JSON input |
| **Multi-sig** | Create multi-sig accounts, view pending approvals |
| **Tokens** | Create and manage fungible tokens |

### Admin Access

Admin access is controlled by wallet address. Add authorized wallets to the `ADMIN_WALLETS` environment variable (comma-separated).

---

## Pages

Here's a quick map of every page in the marketplace:

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Featured collections, trending NFTs, recent activity |
| Collections | `/collections` | Browse all NFT collections |
| Collection Detail | `/collections/{slug}` | Single collection with NFTs and stats |
| Mint Page | `/collections/mint/{slug}` | Mint NFTs from a collection's candy machine |
| Rarity | `/rarity` | Collections with rarity rankings |
| Rarity Detail | `/rarity/{slug}` | Per-NFT rarity scores for a collection |
| Admin | `/admin` | Admin dashboard (wallet-gated) |
