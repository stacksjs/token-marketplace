ALTER TABLE "collections" ADD COLUMN "floor_price" REAL;
ALTER TABLE "collections" ADD COLUMN "volume_traded" REAL;
ALTER TABLE "collections" ADD COLUMN "unique_holders" INTEGER;
ALTER TABLE "collections" ADD COLUMN "banner_url" TEXT;
ALTER TABLE "collections" ADD COLUMN "twitter" TEXT;
ALTER TABLE "collections" ADD COLUMN "discord" TEXT;
ALTER TABLE "collections" ADD COLUMN "is_verified" INTEGER DEFAULT 0;
