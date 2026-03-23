-- Create collection_stats_snapshots table for historical analytics
-- Snapshots are taken hourly by SnapshotCollectionStatsJob

CREATE TABLE IF NOT EXISTS collection_stats_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL,
  floor_price INTEGER,
  listed_count INTEGER DEFAULT 0,
  total_volume INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  unique_holders INTEGER DEFAULT 0,
  avg_price INTEGER DEFAULT 0,
  snapshot_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (collection_id) REFERENCES collections(id)
);

-- Index for time-series queries per collection
CREATE INDEX IF NOT EXISTS idx_stats_snapshots_collection_time
  ON collection_stats_snapshots(collection_id, snapshot_at);

-- Index for global time-series queries
CREATE INDEX IF NOT EXISTS idx_stats_snapshots_time
  ON collection_stats_snapshots(snapshot_at);
