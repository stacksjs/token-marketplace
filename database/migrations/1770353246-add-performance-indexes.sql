-- Performance indexes for frequently queried columns

-- NFTs: queried by owner, collection, mint address, and sale status
CREATE INDEX IF NOT EXISTS "idx_nfts_owner_wallet" ON "nfts" ("owner_wallet_address");
CREATE INDEX IF NOT EXISTS "idx_nfts_collection_id" ON "nfts" ("collection_id");
CREATE INDEX IF NOT EXISTS "idx_nfts_mint_address" ON "nfts" ("mint_address");
CREATE INDEX IF NOT EXISTS "idx_nfts_is_for_sale" ON "nfts" ("is_for_sale");

-- Offers: queried by NFT and status
CREATE INDEX IF NOT EXISTS "idx_offers_nft_id" ON "offers" ("nft_id");
CREATE INDEX IF NOT EXISTS "idx_offers_status" ON "offers" ("status");
CREATE INDEX IF NOT EXISTS "idx_offers_buyer_wallet" ON "offers" ("buyer_wallet_address");

-- Auctions: queried by NFT and status
CREATE INDEX IF NOT EXISTS "idx_auctions_nft_id" ON "auctions" ("nft_id");
CREATE INDEX IF NOT EXISTS "idx_auctions_status" ON "auctions" ("status");

-- Bids: queried by auction
CREATE INDEX IF NOT EXISTS "idx_bids_auction_id" ON "bids" ("auction_id");

-- Users: queried by wallet address for auth
CREATE INDEX IF NOT EXISTS "idx_users_wallet_address" ON "users" ("wallet_address");

-- Multisig: queried by creator and status
CREATE INDEX IF NOT EXISTS "idx_multisig_accounts_creator" ON "multisig_accounts" ("creator_wallet");
CREATE INDEX IF NOT EXISTS "idx_multisig_accounts_status" ON "multisig_accounts" ("status");
CREATE INDEX IF NOT EXISTS "idx_multisig_tx_account_id" ON "multisig_transactions" ("multisig_account_id");
CREATE INDEX IF NOT EXISTS "idx_multisig_tx_status" ON "multisig_transactions" ("status");
CREATE INDEX IF NOT EXISTS "idx_multisig_sigs_tx_id" ON "multisig_signatures" ("multisig_transaction_id");

-- Platform fees: queried by type and date
CREATE INDEX IF NOT EXISTS "idx_platform_fees_type" ON "platform_fees" ("transaction_type");
CREATE INDEX IF NOT EXISTS "idx_platform_fees_created" ON "platform_fees" ("created_at");

-- Mint transactions: queried by wallet and candy machine
CREATE INDEX IF NOT EXISTS "idx_mint_tx_wallet" ON "mint_transactions" ("wallet_address");
CREATE INDEX IF NOT EXISTS "idx_mint_tx_candy_machine" ON "mint_transactions" ("candy_machine_id");
