CREATE TABLE IF NOT EXISTS "collections" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "uuid" TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "image_url" TEXT,
  "hero_image_url" TEXT,
  "is_live" INTEGER DEFAULT 0,
  "is_featured" INTEGER DEFAULT 0,
  "is_minting" INTEGER DEFAULT 0,
  "website" TEXT,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT
);
