# Naked NFTs

Naked NFTs is a Solana NFT marketplace built with [Stacks.js](https://stacksjs.org). It provides everything needed to browse, mint, trade, and manage NFTs — from collection discovery to multi-signature asset management.

## What You Can Do

**As a collector:**
- Browse collections and explore rarity rankings
- Mint NFTs from candy machines (including presale access)
- Buy, sell, make offers, and bid in auctions
- View your portfolio and transaction history

**As a creator:**
- Deploy candy machines with configurable guards
- Set up presale periods with allowlists and discounts
- Quick-mint one-off NFTs or bulk-create up to 100 at once
- Update NFT metadata after minting
- Set up multi-sig accounts for co-owned collections

**As an admin:**
- Manage collections, candy machines, and presales
- Monitor platform fee revenue
- Create and manage fungible tokens
- Review multi-sig transactions

## Tech Stack

- **Framework**: Stacks.js (TypeScript, Bun runtime)
- **Blockchain**: Solana (via ts-tokens)
- **Database**: SQLite with Kysely query builder
- **Auth**: Wallet-based (sign a message, get a JWT)
- **Frontend**: STX templates with server-side rendering

## Next Steps

- [Features](/guide/features) — detailed walkthrough of every feature
- [API Reference](/guide/api-reference) — all endpoints with methods and descriptions
- [Setup](/guide/setup) — get the project running locally
