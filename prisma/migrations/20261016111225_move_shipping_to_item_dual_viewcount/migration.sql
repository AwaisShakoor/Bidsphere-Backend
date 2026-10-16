/*
  Warnings:

  - You are about to drop the column `shipping_cost` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_estimated_days` on the `auctions` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_type` on the `auctions` table. All the data in the column will be lost.
  - Added the required column `shipping_type` to the `items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "auctions" DROP COLUMN "shipping_cost",
DROP COLUMN "shipping_estimated_days",
DROP COLUMN "shipping_type";

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "shipping_cost" DECIMAL(8,2),
ADD COLUMN     "shipping_estimated_days" INTEGER,
ADD COLUMN     "shipping_type" "shipping_type" NOT NULL,
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;
