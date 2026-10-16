/*
  Warnings:

  - You are about to drop the column `auction_id` on the `items` table. All the data in the column will be lost.
  - Added the required column `auctionId` to the `items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_auction_id_fkey";

-- DropIndex
DROP INDEX "items_auction_id_idx";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "auction_id",
ADD COLUMN     "auctionId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "items_auctionId_idx" ON "items"("auctionId");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
