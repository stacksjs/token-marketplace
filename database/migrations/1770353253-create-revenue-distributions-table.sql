-- Create revenue_distributions table for tracking community revenue sharing
-- Every marketplace sale splits platform fees between treasury and staking pool

CREATE TABLE IF NOT EXISTS revenue_distributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id TEXT NOT NULL,
  total_fee REAL NOT NULL,
  treasury_share REAL NOT NULL,
  staking_share REAL NOT NULL,
  treasury_split_pct INTEGER NOT NULL DEFAULT 50,
  tx_signature TEXT,
  sale_amount REAL,
  buyer_wallet TEXT,
  seller_wallet TEXT,
  nft_mint TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for querying revenue by collection
CREATE INDEX IF NOT EXISTS idx_revenue_dist_collection
  ON revenue_distributions(collection_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_revenue_dist_created
  ON revenue_distributions(created_at);

-- Index for looking up by transaction
CREATE INDEX IF NOT EXISTS idx_revenue_dist_tx
  ON revenue_distributions(tx_signature);
