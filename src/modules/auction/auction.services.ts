import { prisma } from "../../config/db";
import { AuctionErrors } from "./auction.errors";
import { CreateAuctionDto } from "./create-auction.dto";
import { UpdateAuctionDto } from "./update-auction.dto";

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

export async function activateScheduledAuctions() {
  await prisma.auction.updateMany({
    where: {
      status: "SCHEDULED",
      startTime: { lte: new Date() },
    },
    data: { status: "LIVE" },
  });
}

export async function closeEndedAuctions() {
  const now = new Date();

  const auctions = await prisma.auction.findMany({
    where: {
      endTime: { lte: now },
      OR: [
        { status: "LIVE" },
        {
          status: "ENDED",
          items: { some: { bids: { some: { status: "ACTIVE" } } } },
        },
      ],
    },
    select: {
      id: true,
      items: {
        select: {
          id: true,
          title: true,
          sellerId: true,
          reservePrice: true,
          bids: {
            where: { status: "ACTIVE", hiddenFromItem: false },
            select: { id: true, bidderId: true, amount: true },
          },
        },
      },
    },
  });

  for (const auction of auctions) {
    await prisma.$transaction(async (tx) => {
      let soldAny = false;

      for (const item of auction.items) {
        const highBid = item.bids[0];
        const amount = highBid ? Number(highBid.amount) : null;
        const reserve =
          item.reservePrice === null ? null : Number(item.reservePrice);
        const meetsReserve =
          amount !== null && (reserve === null || amount >= reserve);

        if (highBid && meetsReserve) {
          soldAny = true;
          await tx.item.update({
            where: { id: item.id },
            data: { winnerId: highBid.bidderId },
          });
          await tx.bid.update({
            where: { id: highBid.id },
            data: { status: "WON" },
          });
          await tx.bid.updateMany({
            where: { itemId: item.id, id: { not: highBid.id } },
            data: { status: "LOST" },
          });

          const feePercent = Number(process.env.PLATFORM_FEE_PERCENT) || 5;
          const platformFee = Number(
            (((amount as number) * feePercent) / 100).toFixed(2),
          );
          const sellerPayout = Number(
            ((amount as number) - platformFee).toFixed(2),
          );

          await tx.payment.create({
            data: {
              auctionId: auction.id,
              itemId: item.id,
              buyerId: highBid.bidderId,
              sellerId: item.sellerId,
              amount: amount as number,
              platformFee,
              sellerPayout,
              stripePaymentIntentId: `pending_${item.id}`,
              status: "PENDING",
              paymentDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
            },
          });

          await tx.notification.create({
            data: {
              userId: highBid.bidderId,
              type: "AUCTION_WON",
              title: "You won!",
              message: `You won "${item.title}". Please pay within 48 hours.`,
              auctionId: auction.id,
              itemId: item.id,
              isRead: false,
            },
          });

          const loserIds = [
            ...new Set(
              item.bids
                .filter((b) => b.bidderId !== highBid.bidderId)
                .map((b) => b.bidderId),
            ),
          ];
          if (loserIds.length > 0) {
            await tx.notification.createMany({
              data: loserIds.map((userId) => ({
                userId,
                type: "AUCTION_LOST" as const,
                title: "Auction ended",
                message: `You didn't win "${item.title}".`,
                auctionId: auction.id,
                itemId: item.id,
                isRead: false,
              })),
            });
          }
          await tx.notification.create({
            data: {
              userId: item.sellerId,
              type: "AUCTION_SOLD",
              title: "Item sold",
              message: `"${item.title}" sold. Waiting for buyer payment.`,
              auctionId: auction.id,
              itemId: item.id,
              isRead: false,
            },
          });
        } else {
          await tx.bid.updateMany({
            where: { itemId: item.id },
            data: { status: "LOST" },
          });

          await tx.notification.create({
            data: {
              userId: item.sellerId,
              type: "NO_SALE",
              title: "No sale",
              message: `"${item.title}" ended with no valid sale.`,
              auctionId: auction.id,
              itemId: item.id,
              isRead: false,
            },
          });
        }
      }

      await tx.auction.update({
        where: { id: auction.id },
        data: { status: soldAny ? "ENDED" : "NO_SALE" },
      });
    });
  }
}

const AUCTION_ENDING_SOON_MINUTES = 30;

export async function notifyAuctionsEndingSoon() {
  const now = new Date();
  const within = new Date(
    now.getTime() + AUCTION_ENDING_SOON_MINUTES * 60 * 1000,
  );

  const auctions = await prisma.auction.findMany({
    where: {
      status: "LIVE",
      endTime: { gt: now, lte: within },
    },
    select: {
      id: true,
      title: true,
      sellerId: true,
      items: {
        select: {
          bids: { select: { bidderId: true } },
        },
      },
    },
  });

  for (const auction of auctions) {
    const userIds = [
      ...new Set([
        auction.sellerId,
        ...auction.items.flatMap((item) =>
          item.bids.map((bid) => bid.bidderId),
        ),
      ]),
    ];
    for (const userId of userIds) {
      const alreadySent = await prisma.notification.findFirst({
        where: {
          userId,
          auctionId: auction.id,
          type: "AUCTION_ENDING_SOON",
        },
        select: { id: true },
      });
      if (alreadySent) continue;
      await prisma.notification.create({
        data: {
          userId,
          type: "AUCTION_ENDING_SOON",
          title: "Auction ending soon",
          message: `"${auction.title}" ends in less than 30 minutes.`,
          auctionId: auction.id,
          isRead: false,
        },
      });
    }
  }
}

/** Flip SCHEDULED → LIVE when start time hits, then LIVE → ENDED when end time hits. */
export async function syncAuctionStatuses() {
  await activateScheduledAuctions();
  await notifyAuctionsEndingSoon();
  await closeEndedAuctions();
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
