import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../config/cloudinary";
import { prisma } from "../../config/db";
import { syncAuctionStatuses } from "../auction/auction.services";
import { CreateItemsDto } from "./create-items.dto";
import { ItemErrors } from "./items.errors";
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
    throw new Error(ItemErrors.AUCTION_NOT_FOUND);
  }

  if (auction.status !== "DRAFT" && auction.status !== "REJECTED") {
    throw new Error(ItemErrors.ONLY_DRAFT);
  }

  const startingPrice = Number(item.startingPrice);
  const reservePrice =
    item.reservePrice === undefined || item.reservePrice === null
      ? undefined
      : Number(item.reservePrice);
  const shippingCost =
    item.shippingCost === undefined || item.shippingCost === null
      ? undefined
      : Number(item.shippingCost);

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
      startingPrice,
      reservePrice,
      shippingType: item.shippingType,
      shippingCost,
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

export async function getPublicItems() {
  await syncAuctionStatuses();

  return prisma.item.findMany({
    where: {
      auction: {
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      startingPrice: true,
      reservePrice: true,
      currentBid: true,
      itemCondition: true,
      shippingType: true,
      shippingCost: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      images: {
        select: {
          id: true,
          url: true,
        },
      },
      auction: {
        select: {
          id: true,
          title: true,
          status: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublicItemById(itemId: string) {
  await syncAuctionStatuses();

  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      auction: {
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      startingPrice: true,
      reservePrice: true,
      currentBid: true,
      itemCondition: true,
      shippingType: true,
      shippingCost: true,
      shippingEstimatedDays: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      images: {
        select: {
          id: true,
          url: true,
        },
      },
      auction: {
        select: {
          id: true,
          title: true,
          status: true,
          startTime: true,
          endTime: true,
        },
      },
      seller: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  return item;
}
