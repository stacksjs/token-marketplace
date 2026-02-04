CREATE TABLE IF NOT EXISTS "nfts" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "uuid" TEXT,
  "collection_id" INTEGER,
  "name" TEXT NOT NULL,
  "token_id" TEXT,
  "description" TEXT,
  "image_url" TEXT,
  "price" REAL DEFAULT 0,
  "is_for_sale" INTEGER DEFAULT 0,
  "is_minting" INTEGER DEFAULT 0,
  "mint_url" TEXT,
  "rarity" TEXT,
  "attributes" TEXT,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  FOREIGN KEY ("collection_id") REFERENCES "collections" ("id") ON DELETE SET NULL
);
