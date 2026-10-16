/*
  Warnings:

  - You are about to drop the column `item_id` on the `auctions` table. All the data in the column will be lost.
  - Added the required column `auction_id` to the `items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "auctions" DROP CONSTRAINT "auctions_item_id_fkey";

-- DropIndex
DROP INDEX "auctions_item_id_idx";

-- AlterTable
ALTER TABLE "auctions" DROP COLUMN "item_id";

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "auction_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "items_auction_id_idx" ON "items"("auction_id");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
