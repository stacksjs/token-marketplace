CREATE TABLE IF NOT EXISTS trading_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('buy', 'sell', 'list', 'offer', 'referral')),
  points INTEGER NOT NULL DEFAULT 0,
  sol_amount REAL NOT NULL DEFAULT 0,
  multiplier REAL NOT NULL DEFAULT 1,
  season TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_trading_rewards_wallet ON trading_rewards(wallet);
CREATE INDEX idx_trading_rewards_season ON trading_rewards(season);
CREATE INDEX idx_trading_rewards_wallet_season ON trading_rewards(wallet, season);
CREATE INDEX idx_trading_rewards_action ON trading_rewards(action);
