-- Add enhanced auction columns for advanced auction features
-- min_bid_increment: minimum amount above current bid
-- anti_snipe_minutes: extend auction if bid placed in last N minutes
-- price_curve: for Dutch auction price decay configuration

ALTER TABLE auctions ADD COLUMN min_bid_increment INTEGER DEFAULT 0;
ALTER TABLE auctions ADD COLUMN anti_snipe_minutes INTEGER DEFAULT 0;
ALTER TABLE auctions ADD COLUMN price_curve TEXT;

-- Composite index for finding active auctions ending soon
CREATE INDEX IF NOT EXISTS idx_auctions_status_ends_at
  ON auctions(status, ends_at);

-- Index for finding auctions by seller
CREATE INDEX IF NOT EXISTS idx_auctions_seller
  ON auctions(seller_wallet_address);

-- Index for finding auctions by NFT
CREATE INDEX IF NOT EXISTS idx_auctions_mint
  ON auctions(mint_address);
