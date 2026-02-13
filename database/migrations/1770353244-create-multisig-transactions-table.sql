CREATE TABLE IF NOT EXISTS "multisig_transactions" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "uuid" TEXT NOT NULL UNIQUE,
  "multisig_account_id" INTEGER NOT NULL,
  "transaction_type" TEXT NOT NULL,
  "description" TEXT,
  "proposer_wallet" TEXT NOT NULL,
  "status" TEXT DEFAULT 'pending',
  "required_signatures" INTEGER NOT NULL,
  "collected_signatures" INTEGER DEFAULT 0,
  "transaction_data" TEXT,
  "expires_at" TEXT,
  "executed_signature" TEXT,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  FOREIGN KEY ("multisig_account_id") REFERENCES "multisig_accounts" ("id")
);
