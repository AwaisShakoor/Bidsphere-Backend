-- Rename auction status active to live
ALTER TYPE "auction_status" RENAME VALUE 'active' TO 'live';
