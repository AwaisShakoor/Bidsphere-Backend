/*
  Warnings:

  - Added the required column `seller_id` to the `auctions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "auctions" ADD COLUMN     "seller_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "auctions_seller_id_idx" ON "auctions"("seller_id");

-- AddForeignKey
ALTER TABLE "auctions" ADD CONSTRAINT "auctions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
