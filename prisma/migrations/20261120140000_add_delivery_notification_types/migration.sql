-- Add delivery-related notification types (idempotent).
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'item_shipped';
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'item_delivered';
