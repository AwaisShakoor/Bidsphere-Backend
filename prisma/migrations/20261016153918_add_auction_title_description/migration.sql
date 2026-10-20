-- AlterTable
ALTER TABLE "auctions" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "title" VARCHAR(100) NOT NULL DEFAULT 'Untitled';
