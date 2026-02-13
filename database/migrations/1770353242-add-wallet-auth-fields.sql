ALTER TABLE "users" ADD COLUMN "nonce" TEXT;
ALTER TABLE "users" ADD COLUMN "nonce_expires_at" TEXT;
ALTER TABLE "users" ADD COLUMN "auth_type" TEXT DEFAULT 'email';
