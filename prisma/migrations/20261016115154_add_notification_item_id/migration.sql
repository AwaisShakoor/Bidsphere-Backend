/*
  Warnings:

  - You are about to drop the column `height` on the `item_images` table. All the data in the column will be lost.
  - You are about to drop the column `original_filename` on the `item_images` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `item_images` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "item_images" DROP COLUMN "height",
DROP COLUMN "original_filename",
DROP COLUMN "width";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "item_id" UUID;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
