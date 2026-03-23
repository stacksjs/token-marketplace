-- Create merkle_trees table for tracking compressed NFT tree accounts
-- Each tree has a fixed capacity determined by maxDepth (capacity = 2^maxDepth)

CREATE TABLE IF NOT EXISTS merkle_trees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL UNIQUE,
  collection_id TEXT NOT NULL,
  max_depth INTEGER NOT NULL,
  max_buffer_size INTEGER NOT NULL DEFAULT 64,
  canopy_depth INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL,
  used_leaves INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

-- Index for finding trees by collection
CREATE INDEX IF NOT EXISTS idx_merkle_trees_collection_id ON merkle_trees(collection_id);

-- Index for finding available trees (active with remaining capacity)
CREATE INDEX IF NOT EXISTS idx_merkle_trees_status ON merkle_trees(status);

-- Index for capacity monitoring
CREATE INDEX IF NOT EXISTS idx_merkle_trees_usage ON merkle_trees(used_leaves, capacity);
