-- Baseline migration: objects already exist on local DB.
-- Marked applied via: prisma migrate resolve --applied 20260320121500_sync_existing_db
-- Do NOT run migrate reset.

-- delivery_status enum
DO $$ BEGIN
  CREATE TYPE "delivery_status" AS ENUM ('awaiting_shipment', 'shipped', 'delivered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- payments delivery columns
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "delivery_status" "delivery_status";
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "shipped_at" TIMESTAMPTZ(6);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMPTZ(6);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "tracking_note" VARCHAR(255);

CREATE INDEX IF NOT EXISTS "payments_delivery_status_idx" ON "payments"("delivery_status");

-- prior drift: users.stripe_account_id
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_account_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_account_id_key" ON "users"("stripe_account_id");

-- prior drift: bids.hidden_from_item
ALTER TABLE "bids" ADD COLUMN IF NOT EXISTS "hidden_from_item" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "bids_item_id_hidden_from_item_idx" ON "bids"("item_id", "hidden_from_item");

-- prior drift: notifications
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "title" VARCHAR(150);

-- prior drift: notification_type variants
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'auction_rejected';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'auction_approved';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'payment_expired';