import { prisma } from "../../config/db";
import { createAuctionDto } from "./create-auction.dto";
import { UpdateAuctionDto } from "./update-auction-dto";

export async function createAuction(
  sellerId: string,
  auctionData: createAuctionDto,
) {
  const item = await prisma.item.findUnique({
    where: { id: auctionData.itemId },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  if (item.sellerId !== sellerId) {
    throw new Error("You are not the owner of this item");
  }

  const startTime = new Date(auctionData.startTime);
  const endTime = new Date(auctionData.endTime);

  if (startTime >= endTime) {
    throw new Error("Start time must be before end time");
  }

  return prisma.auction.create({
    data: {
      itemId: auctionData.itemId,
      startingPrice: auctionData.startingPrice,
      reservePrice: auctionData.reservePrice,
      shippingType: auctionData.shippingType,
      shippingCost: auctionData.shippingCost,
      startTime,
      endTime,
      status: "DRAFT",
    },
    select: {
      id: true,
      itemId: true,
      startingPrice: true,
      reservePrice: true,
      shippingType: true,
      shippingCost: true,
      startTime: true,
      endTime: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateAuction(
  sellerId: string,
  auctionId: string,
  updateAuctionDto: UpdateAuctionDto,
) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      item: true,
    },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }
  if (auction.item.sellerId !== sellerId) {
    throw new Error("You are not the owner of this item");
  }

  if (auction.status !== "DRAFT") {
    throw new Error("Only DRAFT auctions can be updated");
  }

  if (
    updateAuctionDto.shippingType === "FLAT_RATE" &&
    updateAuctionDto.shippingCost == null &&
    auction.shippingCost == null
  ) {
    throw new Error("shippingCost is required for FLAT_RATE");
  }

  return prisma.auction.update({
    where: { id: auctionId },
    data: {
      startingPrice: updateAuctionDto.startingPrice,
      reservePrice: updateAuctionDto.reservePrice,
      shippingType: updateAuctionDto.shippingType,
      shippingCost: updateAuctionDto.shippingCost,
      startTime: updateAuctionDto.startTime,
      endTime: updateAuctionDto.endTime,
    },
    select: {
      id: true,
      itemId: true,
      startingPrice: true,
      reservePrice: true,
      currentBid: true,
      shippingType: true,
      shippingCost: true,
      startTime: true,
      endTime: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteAuction(sellerId: string, auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });
  await prisma.auction.delete({
    where: { id: auctionId },
    include: {
      item: true,
    },
  });
  return auction;
}

export async function getMyAuctions(sellerId: string, categoryId?: string) {
  return prisma.auction.findMany({
    where: {
      item: {
        sellerId,
        ...(categoryId ? { categoryId } : {}),
      },
    },
    select: {
      id: true,
      itemId: true,
      startingPrice: true,
      reservePrice: true,
      currentBid: true,
      shippingType: true,
      shippingCost: true,
      startTime: true,
      endTime: true,
      status: true,
      createdAt: true,
      item: {
        select: {
          id: true,
          title: true,
          description: true,
          itemCondition: true,
          categoryId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getAuctions(categoryId?: string) {
  return prisma.auction.findMany({
    where: {
      status: "ACTIVE",
      ...(categoryId ? { item: { categoryId } } : {}),
    },
    select: {
      id: true,
      itemId: true,
      startingPrice: true,
      reservePrice: true,
      currentBid: true,
      shippingType: true,
      shippingCost: true,
      startTime: true,
      endTime: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      item: {
        select: {
          id: true,
          title: true,
          description: true,
          itemCondition: true,
          categoryId: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });
}

export async function getAuctionById(id: string) {
  const auction = await prisma.auction.findUnique({
    where: { id },
    select: {
      id: true,
      itemId: true,
      startingPrice: true,
      reservePrice: true,
      currentBid: true,
      shippingType: true,
      shippingCost: true,
      startTime: true,
      endTime: true,
      status: true,
      viewCount: true,
      winnerId: true,
      createdAt: true,
      item: {
        select: {
          id: true,
          title: true,
          description: true,
          itemCondition: true,
          categoryId: true,
          sellerId: true,
        },
      },
    },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  return auction;
}
