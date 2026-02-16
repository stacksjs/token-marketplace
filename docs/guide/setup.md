# Setup

## Prerequisites

- [Bun](https://bun.sh) v1.1+ (runtime and package manager)
- A Solana wallet (Phantom, Solflare, or any Wallet Standard compatible)

## Quick Start

```bash
# Install dependencies
bun install

# Start the API server
buddy dev:api

# Start the frontend (in another terminal)
buddy dev
```

The frontend runs on `http://localhost:3000` and the API on `http://localhost:3008`.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Key Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_URL` | Frontend URL | `http://localhost:3000` |
| `API_URL` | API server URL | `http://localhost:3008` |
| `SOLANA_RPC_URL` | Solana RPC endpoint | devnet |
| `TOKENS_MOCK_MODE` | Use mock blockchain calls | `false` |
| `PLATFORM_FEE_ENABLED` | Enable 1% platform fee | `true` |
| `PLATFORM_FEE_BPS` | Fee in basis points | `100` (1%) |
| `PLATFORM_FEE_WALLET` | Wallet to receive fees | — |
| `ADMIN_WALLETS` | Comma-separated admin wallet addresses | — |

### Mock Mode

Set `TOKENS_MOCK_MODE=true` to run without a Solana connection. All blockchain calls return realistic fake data. Useful for local development and testing.

## Database

The marketplace uses SQLite. Run migrations to set up the database:

```bash
buddy migrate
```

## Testing

```bash
# Run all project tests
TOKENS_MOCK_MODE=true bun test tests/unit/ tests/feature/

# Run a single test file
TOKENS_MOCK_MODE=true bun test tests/unit/functional.test.ts
```

## Building for Production

```bash
buddy build
```

## Project Structure

```
token-marketplace/
  app/
    Actions/          # Request handlers (one per endpoint)
    Models/           # Database models
    Services/         # Business logic (TokenService, PlatformFeeService)
    Gates.ts          # Authorization gates (admin access)
  config/             # App configuration
  database/
    migrations/       # SQL migration files
  resources/
    views/            # Page templates (.stx files)
  routes/
    api.ts            # All API route definitions
  tests/
    unit/             # Unit tests
    feature/          # Feature tests
```
