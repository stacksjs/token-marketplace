CREATE TABLE IF NOT EXISTS "multisig_accounts" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "uuid" TEXT NOT NULL UNIQUE,
  "address" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "threshold" INTEGER NOT NULL,
  "total_signers" INTEGER NOT NULL,
  "signers" TEXT NOT NULL,
  "authority_type" TEXT DEFAULT 'owner',
  "target_mint" TEXT,
  "creator_wallet" TEXT NOT NULL,
  "status" TEXT DEFAULT 'active',
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT
);
