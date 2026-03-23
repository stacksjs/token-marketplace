CREATE TABLE IF NOT EXISTS "marketplace_events" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "type" TEXT NOT NULL,
  "nft_id" INTEGER,
  "nft_mint" TEXT,
  "collection_id" INTEGER,
  "from_wallet" TEXT,
  "to_wallet" TEXT,
  "price" REAL,
  "currency" TEXT DEFAULT 'SOL',
  "source" TEXT DEFAULT 'hoodies',
  "tx_signature" TEXT,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_marketplace_events_type"
  ON "marketplace_events" ("type");

CREATE INDEX IF NOT EXISTS "idx_marketplace_events_collection"
  ON "marketplace_events" ("collection_id");

CREATE INDEX IF NOT EXISTS "idx_marketplace_events_nft_mint"
  ON "marketplace_events" ("nft_mint");

CREATE INDEX IF NOT EXISTS "idx_marketplace_events_created"
  ON "marketplace_events" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_marketplace_events_from_wallet"
  ON "marketplace_events" ("from_wallet");

CREATE INDEX IF NOT EXISTS "idx_marketplace_events_to_wallet"
  ON "marketplace_events" ("to_wallet");
