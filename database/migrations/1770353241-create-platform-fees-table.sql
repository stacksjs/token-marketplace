CREATE TABLE IF NOT EXISTS "platform_fees" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "transaction_type" TEXT NOT NULL,
  "transaction_signature" TEXT,
  "nft_id" INTEGER,
  "mint_address" TEXT,
  "sale_amount" INTEGER NOT NULL,
  "fee_amount" INTEGER NOT NULL,
  "fee_basis_points" INTEGER DEFAULT 100,
  "platform_wallet" TEXT NOT NULL,
  "seller_wallet" TEXT,
  "buyer_wallet" TEXT,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
