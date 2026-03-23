ALTER TABLE "nfts" ADD COLUMN "is_compressed" INTEGER DEFAULT 0;
ALTER TABLE "nfts" ADD COLUMN "tree_address" TEXT;
ALTER TABLE "nfts" ADD COLUMN "leaf_index" INTEGER;
ALTER TABLE "nfts" ADD COLUMN "indexed_at" TEXT;
ALTER TABLE "nfts" ADD COLUMN "status" TEXT DEFAULT 'unlisted';

CREATE INDEX IF NOT EXISTS "idx_nfts_status" ON "nfts" ("status");
CREATE INDEX IF NOT EXISTS "idx_nfts_owner_collection" ON "nfts" ("owner_wallet_address", "collection_id");
CREATE INDEX IF NOT EXISTS "idx_nfts_status_listing_price" ON "nfts" ("status", "listing_price");
CREATE INDEX IF NOT EXISTS "idx_nfts_name" ON "nfts" ("name");
