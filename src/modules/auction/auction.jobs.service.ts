import { prisma } from "../../config/db";

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
