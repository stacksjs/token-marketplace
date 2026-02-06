CREATE TABLE IF NOT EXISTS "mint_transactions" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "candy_machine_id" REAL,
  "nft_id" REAL,
  "wallet_address" TEXT,
  "transaction_signature" TEXT,
  "status" TEXT,
  "mint_address" TEXT,
  "error_message" TEXT,
  "amount_paid" REAL,
  "presale_id" REAL,
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT
);