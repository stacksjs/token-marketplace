CREATE TABLE IF NOT EXISTS "bids" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "uuid" TEXT,
  "auction_id" INTEGER,
  "bidder_wallet_address" TEXT,
  "amount" INTEGER,
  "transaction_signature" TEXT,
  "status" TEXT DEFAULT 'pending',
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  FOREIGN KEY ("auction_id") REFERENCES "auctions" ("id")
);