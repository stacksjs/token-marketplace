CREATE TABLE IF NOT EXISTS "offers" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "uuid" TEXT,
  "nft_id" INTEGER,
  "mint_address" TEXT,
  "buyer_wallet_address" TEXT,
  "amount" INTEGER,
  "currency" TEXT DEFAULT 'SOL',
  "status" TEXT DEFAULT 'pending',
  "expiry_at" TEXT,
  "transaction_signature" TEXT,
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  FOREIGN KEY ("nft_id") REFERENCES "nfts" ("id")
);