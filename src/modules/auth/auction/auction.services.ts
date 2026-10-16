import { prisma } from "../../../config/db";
import { AuctionErrors } from "./auction.errors";
import { CreateAuctionDto } from "./create-auction.dto";
import { UpdateAuctionDto } from "./update-auction.dto";

export async function createAuction(
  sellerId: string,
  createAuctionDto: CreateAuctionDto,
) {
  const startTime = new Date(createAuctionDto.startTime);
  const endTime = new Date(createAuctionDto.endTime);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new Error(AuctionErrors.INVALID_TIMES);
  }
  if (endTime <= startTime) {
    throw new Error(AuctionErrors.END_BEFORE_START);
  }

  return prisma.auction.create({
    data: {
      sellerId,
      title: createAuctionDto.title,
      description: createAuctionDto.description,
      startTime,
      endTime,
    },
  });
}

export async function getMyAuctions(sellerId: string) {
  return prisma.auction.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAuctionById(sellerId: string, auctionId: string) {
  const auction = await prisma.auction.findFirst({
    where: { id: auctionId, sellerId },
  });

  if (!auction) {
    throw new Error(AuctionErrors.NOT_FOUND);
  }

  return auction;
}

export async function updateAuction(
  sellerId: string,
  auctionId: string,
  updateAuctionDto: UpdateAuctionDto,
) {
  const existing = await prisma.auction.findFirst({
    where: { id: auctionId, sellerId },
  });

  if (!existing) {
    throw new Error(AuctionErrors.NOT_FOUND);
  }

  if (existing.status !== "DRAFT") {
    throw new Error(AuctionErrors.ONLY_DRAFT_UPDATE);
  }

  const title = updateAuctionDto.title ?? existing.title;
  const description = updateAuctionDto.description ?? existing.description;

  const startTime = updateAuctionDto.startTime
    ? new Date(updateAuctionDto.startTime)
    : existing.startTime;
  const endTime = updateAuctionDto.endTime
    ? new Date(updateAuctionDto.endTime)
    : existing.endTime;

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new Error(AuctionErrors.INVALID_TIMES);
  }
  if (endTime <= startTime) {
    throw new Error(AuctionErrors.END_BEFORE_START);
  }

  return prisma.auction.update({
    where: { id: auctionId },
    data: { title, description, startTime, endTime },
  });
}

export async function deleteAuction(sellerId: string, auctionId: string) {
  const existing = await prisma.auction.findFirst({
    where: { id: auctionId, sellerId },
  });

  if (!existing) {
    throw new Error(AuctionErrors.NOT_FOUND);
  }

  if (existing.status !== "DRAFT") {
    throw new Error(AuctionErrors.ONLY_DRAFT_DELETE);
  }

  return prisma.auction.delete({
    where: { id: auctionId },
  });
}
