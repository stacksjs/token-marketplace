CREATE TABLE IF NOT EXISTS "auctions" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "uuid" TEXT,
  "nft_id" INTEGER,
  "mint_address" TEXT,
  "seller_wallet_address" TEXT,
  "auction_type" TEXT DEFAULT 'english',
  "starting_price" INTEGER,
  "reserve_price" INTEGER,
  "current_bid" INTEGER,
  "highest_bidder_wallet" TEXT,
  "starts_at" TEXT,
  "ends_at" TEXT,
  "status" TEXT DEFAULT 'pending',
  "settlement_signature" TEXT,
  "created_at" TEXT not null default CURRENT_TIMESTAMP,
  "updated_at" TEXT,
  FOREIGN KEY ("nft_id") REFERENCES "nfts" ("id")
);