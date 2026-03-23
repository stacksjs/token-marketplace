CREATE TABLE IF NOT EXISTS "nft_traits" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "mint_address" TEXT NOT NULL,
  "collection_id" INTEGER NOT NULL,
  "trait_type" TEXT NOT NULL,
  "trait_value" TEXT NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_nft_traits_mint_trait"
  ON "nft_traits" ("mint_address", "trait_type");

CREATE INDEX IF NOT EXISTS "idx_nft_traits_collection_type_value"
  ON "nft_traits" ("collection_id", "trait_type", "trait_value");

CREATE INDEX IF NOT EXISTS "idx_nft_traits_mint"
  ON "nft_traits" ("mint_address");
