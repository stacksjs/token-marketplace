# API Reference

All endpoints are served from the API server (default: `http://localhost:3008`). Authenticated routes require a JWT token in the `Authorization: Bearer <token>` header.

A live endpoint list is also available at `GET /api/info`.

## Health & Info

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/api/info` | No | List all API endpoints |

## Marketplace

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/marketplace/home` | No | Home page data (featured, popular, for-sale NFTs) |
| GET | `/marketplace/collections` | No | List collections (supports `?search=` and `?page=`) |
| GET | `/marketplace/collections/{slug}` | No | Collection details by slug |
| GET | `/marketplace/collections/mint/{slug}` | No | Minting page data for a collection |
| GET | `/marketplace/nfts` | No | List NFTs (supports `?search=`, `?collection=`, `?page=`) |
| GET | `/marketplace/nfts/{id}` | No | NFT details by ID |
| GET | `/marketplace/rarity` | No | Collections with rarity data |
| GET | `/marketplace/rarity/{slug}` | No | Rarity rankings for a collection |
| GET | `/marketplace/activity` | No | Global activity feed |
| GET | `/marketplace/activity/{collectionSlug}` | No | Activity feed for a specific collection |
| GET | `/marketplace/profile/{walletAddress}` | No | User profile by wallet address |
| POST | `/marketplace/collections/stats` | Yes | Update collection stats |

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/wallet/challenge` | No | Request a wallet auth challenge nonce |
| POST | `/auth/wallet/verify` | No | Verify wallet signature and get JWT |
| GET | `/me` | Yes | Get authenticated user |
| POST | `/logout` | Yes | Logout |
| POST | `/auth/link-wallet` | Yes | Link wallet to existing account |
| POST | `/auth/refresh` | No | Refresh JWT token |
| GET | `/auth/tokens` | Yes | List active tokens |
| POST | `/auth/token` | Yes | Create a new API token |
| DELETE | `/auth/tokens/{id}` | Yes | Revoke a token |

### Wallet Auth Flow

```
Client                          Server
  |                               |
  |  POST /auth/wallet/challenge  |
  |  { walletAddress }            |
  |------------------------------>|
  |  { nonce, message }           |
  |<------------------------------|
  |                               |
  |  wallet.signMessage(message)  |
  |                               |
  |  POST /auth/wallet/verify     |
  |  { walletAddress, signature,  |
  |    nonce }                    |
  |------------------------------>|
  |  { token, user }              |
  |<------------------------------|
  |                               |
  |  Use token in Authorization   |
  |  header for all auth requests |
```

## NFT Trading

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/nfts/list` | No | List an NFT for sale |
| POST | `/nfts/buy` | No | Buy a listed NFT |
| POST | `/nfts/delist` | No | Remove a listing |
| POST | `/nfts/confirm` | No | Confirm an on-chain transaction |
| POST | `/nfts/offer` | No | Make an offer on an NFT |
| POST | `/nfts/offer/accept` | No | Accept an offer |
| POST | `/nfts/offer/cancel` | No | Cancel an offer |
| POST | `/nfts/auction` | No | Create an auction |
| POST | `/nfts/auction/bid` | No | Place a bid |
| POST | `/nfts/auction/settle` | No | Settle a completed auction |
| POST | `/nfts/auction/cancel` | No | Cancel an auction |
| POST | `/nfts/escrow` | No | Create escrow |
| POST | `/nfts/escrow/settle` | No | Settle escrow |
| POST | `/nfts/escrow/cancel` | No | Cancel escrow |
| POST | `/nfts/update` | Yes | Update NFT metadata |
| POST | `/nfts/bulk-create` | Yes | Bulk create NFTs (max 100) |

## Minting

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/mint` | No | Build a mint transaction from candy machine |
| POST | `/mint/verify` | No | Verify a mint transaction |
| GET | `/mint/status/{transactionId}` | No | Check mint transaction status |
| POST | `/mint/quick` | Yes | Quick mint a single NFT |

## Candy Machine (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/candy-machine` | Yes | Create a candy machine |
| POST | `/candy-machine/{id}/config-lines` | Yes | Add config lines |
| GET | `/candy-machine/{id}` | Yes | Get candy machine details |
| PATCH | `/candy-machine/{id}/status` | Yes | Update candy machine status |
| POST | `/candy-machine/{id}/sync` | Yes | Sync on-chain state |
| POST | `/candy-machine/{id}/guards` | Yes | Manage mint guards |
| POST | `/candy-machine/{id}/upload` | Yes | Upload config lines |

## Presale

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/presale/{uuid}` | No | Get presale details |
| POST | `/presale/check-eligibility` | No | Check wallet eligibility |
| POST | `/presale` | Yes | Create a presale |
| PATCH | `/presale/{id}` | Yes | Update a presale |

## Wallet

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/wallet/connect` | No | Connect a wallet |
| POST | `/wallet/disconnect` | No | Disconnect a wallet |
| GET | `/wallet/balance/{walletAddress}` | No | Get wallet SOL balance |

## Multi-Signature (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/multisig` | Yes | Create a multi-sig account |
| GET | `/multisig` | Yes | List multi-sig accounts |
| GET | `/multisig/{id}` | Yes | Get multi-sig details |
| POST | `/multisig/propose` | Yes | Propose a transaction |
| POST | `/multisig/sign` | Yes | Sign a transaction |
| POST | `/multisig/execute` | Yes | Execute a transaction |
| POST | `/multisig/cancel` | Yes | Cancel a transaction |

## Fungible Tokens (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/token/create` | Yes | Create a fungible token |
| POST | `/token/mint` | Yes | Mint tokens |
| POST | `/token/transfer` | Yes | Transfer tokens |
| GET | `/token/{mintAddress}` | Yes | Get token info |

## Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/fees` | Yes | Platform fee statistics |

## Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/stats` | No | Dashboard statistics |
| GET | `/dashboard/activity` | No | Dashboard activity feed |
| GET | `/dashboard/health` | No | System health check |
