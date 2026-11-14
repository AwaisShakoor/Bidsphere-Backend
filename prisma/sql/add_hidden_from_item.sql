ALTER TABLE "bids"
ADD COLUMN IF NOT EXISTS "hidden_from_item" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "bids_item_id_hidden_from_item_idx"
ON "bids" ("item_id", "hidden_from_item");
