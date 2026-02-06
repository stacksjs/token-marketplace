CREATE TABLE IF NOT EXISTS "presales" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "collection_id" REAL,
  "wallet_addresses" TEXT,
  "merkle_root" TEXT,
  "discount" REAL,
  "max_mints_per_wallet" REAL,
  "presale_starts_at" TEXT,
  "presale_expires_at" TEXT,
  "is_active" INTEGER,
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT
);