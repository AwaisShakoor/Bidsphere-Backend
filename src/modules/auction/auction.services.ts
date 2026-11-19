import { prisma } from "../../config/db";
import { getConnectionStatus } from "../payment/payment.connect.service";
import { AuctionErrors } from "./auction.errors";
import { CreateAuctionDto } from "./create-auction.dto";
import { UpdateAuctionDto } from "./update-auction.dto";
import { syncAuctionStatuses } from "./auction.jobs.service";

function assertFutureAuctionTimes(startTime: Date, endTime: Date) {
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new Error(AuctionErrors.INVALID_TIMES);
  }
  if (endTime <= startTime) {
    throw new Error(AuctionErrors.END_BEFORE_START);
  }

  const now = new Date();
  if (startTime <= now) {
    throw new Error(AuctionErrors.START_MUST_BE_FUTURE);
  }
  if (endTime <= now) {
    throw new Error(AuctionErrors.END_MUST_BE_FUTURE);
  }
}

export async function createAuction(
  sellerId: string,
  createAuctionDto: CreateAuctionDto,
) {
  const startTime = new Date(createAuctionDto.startTime);
  const endTime = new Date(createAuctionDto.endTime);

  assertFutureAuctionTimes(startTime, endTime);

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
  await syncAuctionStatuses();

  return prisma.auction.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAuctionById(sellerId: string, auctionId: string) {
  await syncAuctionStatuses();

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

  if (
    existing.status !== "DRAFT" &&
    existing.status !== "REJECTED" &&
    existing.status !== "NO_SALE"
  ) {
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

  assertFutureAuctionTimes(startTime, endTime);

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

export async function submitAuction(sellerId: string, auctionId: string) {
  const existing = await prisma.auction.findFirst({
    where: { id: auctionId, sellerId },
    include: { items: { select: { id: true } } },
  });

  if (!existing) {
    throw new Error(AuctionErrors.NOT_FOUND);
  }

  if (
    existing.status !== "DRAFT" &&
    existing.status !== "REJECTED" &&
    existing.status !== "NO_SALE"
  ) {
    throw new Error(AuctionErrors.ONLY_DRAFT_SUBMIT);
  }

  if (existing.items.length === 0) {
    throw new Error(AuctionErrors.NO_ITEMS);
  }

  const status = await getConnectionStatus(sellerId);
  if(!status.payoutEnabled) {
    throw new Error(AuctionErrors.STRIPE_CONNECT_REQUIRED);
  }

  // Resubmit / submit: times must still be in the future.
  assertFutureAuctionTimes(existing.startTime, existing.endTime);

  const itemIds = existing.items.map((item) => item.id);

  return prisma.$transaction(async (tx) => {
    // NO_SALE resubmit: keep bids for My Bids, hide them from item history.
    if (existing.status === "NO_SALE" && itemIds.length > 0) {
      await tx.bid.updateMany({
        where: { itemId: { in: itemIds }, hiddenFromItem: false },
        data: { hiddenFromItem: true, status: "LOST" },
      });

      await tx.item.updateMany({
        where: { id: { in: itemIds } },
        data: { currentBid: null, winnerId: null },
      });
    }

    return tx.auction.update({
      where: { id: auctionId },
      data: { status: "PENDING_APPROVAL", rejectionReason: null },
    });
  });
}
