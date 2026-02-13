CREATE TABLE IF NOT EXISTS "multisig_signatures" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "multisig_transaction_id" INTEGER NOT NULL,
  "signer_wallet" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "signed_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("multisig_transaction_id") REFERENCES "multisig_transactions" ("id"),
  UNIQUE("multisig_transaction_id", "signer_wallet")
);
