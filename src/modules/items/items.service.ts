import { deleteFromCloudinary, uploadToCloudinary } from "../../config/cloudinary";
import { prisma } from "../../config/db";
import { CreateItemsDto } from "./create-items.dto";
import { UpdateItemsDto } from "./update-items.dto";

export async function createItem(
  auctionId: string,
  sellerId: string,
  item: CreateItemsDto,
  files: Express.Multer.File[] = [],
) {
  const auction = await prisma.auction.findFirst({
    where: { id: auctionId, sellerId },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  if (auction.status !== "DRAFT") {
    throw new Error("Items can only be added to a draft auction");
  }

  const images = [];

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const uploaded = await uploadToCloudinary(file);

    images.push({
      cloudinaryPublicId: uploaded.public_id,
      url: uploaded.secure_url,
      fileSize: file.size,
      mimeType: file.mimetype,
      sortOrder: index,
    });
  }

  return prisma.item.create({
    data: {
      sellerId,
      auctionId,
      title: item.title,
      description: item.description,
      categoryId: item.categoryId,
      itemCondition: item.itemCondition,
      startingPrice: item.startingPrice,
      reservePrice: item.reservePrice,
      shippingType: item.shippingType,
      shippingCost: item.shippingCost,
      images: {
        create: images,
      },
    },
    include: {
      images: true,
    },
  });
}

export async function getItems(auctionId: string) {
  return prisma.item.findMany({
    where: { auctionId },
    include: {
      images: true,
    },
  });
}

export async function getItem(itemId: string) {
  return prisma.item.findFirst({
    where: {
      id: itemId,
    },
    include: {
      images: true,
    },
  });
}

function idsToRemove(removeImageIds?: string | string[]) {
  if (!removeImageIds) return [];
  if (Array.isArray(removeImageIds)) return removeImageIds;
  return [removeImageIds];
}

async function removeItemImages(itemId: string, imageIds: string[]) {
  if (imageIds.length === 0) return;

  const images = await prisma.itemImage.findMany({
    where: { itemId, id: { in: imageIds } },
  });

  for (const image of images) {
    await deleteFromCloudinary(image.cloudinaryPublicId);
  }

  await prisma.itemImage.deleteMany({
    where: { itemId, id: { in: images.map((image) => image.id) } },
  });
}

async function addItemImages(itemId: string, files: Express.Multer.File[]) {
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const uploaded = await uploadToCloudinary(file);

    await prisma.itemImage.create({
      data: {
        itemId,
        cloudinaryPublicId: uploaded.public_id,
        url: uploaded.secure_url,
        fileSize: file.size,
        mimeType: file.mimetype,
        sortOrder: index,
      },
    });
  }
}

export async function updateItem(
  itemId: string,
  data: UpdateItemsDto,
  files: Express.Multer.File[] = [],
) {
  await removeItemImages(itemId, idsToRemove(data.removeImageIds));
  await addItemImages(itemId, files);

  return prisma.item.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      itemCondition: data.itemCondition,
      startingPrice: data.startingPrice,
      reservePrice: data.reservePrice,
      shippingType: data.shippingType,
      shippingCost: data.shippingCost,
    },
    include: { images: true },
  });
}

export async function deletItem(itemId: string) {
  return await prisma.item.delete({
    where: {
      id: itemId,
    },
  });
}
