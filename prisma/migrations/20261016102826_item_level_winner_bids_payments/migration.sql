/*
  Warnings:

  - You are about to drop the column `current_bid` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `reserve_price` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `starting_price` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `winner_id` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `auction_id` on the `bids` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[item_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `item_id` to the `bids` table without a default value. This is not possible if the table is not empty.
  - Added the required column `starting_price` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `item_id` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "auctions" DROP CONSTRAINT "auctions_winner_id_fkey";

-- DropForeignKey
ALTER TABLE "bids" DROP CONSTRAINT "bids_auction_id_fkey";

-- DropIndex
DROP INDEX "auctions_winner_id_idx";

-- DropIndex
DROP INDEX "bids_auction_id_amount_idx";

-- DropIndex
DROP INDEX "payments_auction_id_key";

-- AlterTable
ALTER TABLE "auctions" DROP COLUMN "current_bid",
DROP COLUMN "reserve_price",
DROP COLUMN "starting_price",
DROP COLUMN "winner_id";

-- AlterTable
ALTER TABLE "bids" DROP COLUMN "auction_id",
ADD COLUMN     "item_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "current_bid" DECIMAL(12,2),
ADD COLUMN     "reserve_price" DECIMAL(12,2),
ADD COLUMN     "starting_price" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "winner_id" UUID;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "item_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "bids_item_id_amount_idx" ON "bids"("item_id", "amount");

-- CreateIndex
CREATE INDEX "items_winner_id_idx" ON "items"("winner_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_item_id_key" ON "payments"("item_id");

-- CreateIndex
CREATE INDEX "payments_auction_id_idx" ON "payments"("auction_id");

-- CreateIndex
CREATE INDEX "payments_item_id_idx" ON "payments"("item_id");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
