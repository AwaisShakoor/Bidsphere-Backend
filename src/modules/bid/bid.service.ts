import { prisma } from "../../config/db";
import { syncAuctionStatuses } from "../auction/auction.services";
import { BidErrors } from "./bid.errors";
import { CreateBidDto } from "./create-bid.dto";

export async function createBid(
  itemId: string,
  bidderId: string,
  data: CreateBidDto,
) {
  await syncAuctionStatuses();

  const amount = Number(data.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error(BidErrors.INVALID_AMOUNT);
  }

  return prisma.$transaction(async (tx) => {
    //lock this item row so two bids at once cannot both win
    await tx.$executeRaw`
    SELECT id FROM items WHERE id = ${itemId}::uuid FOR UPDATE`;

    const item = await tx.item.findUnique({
      where: { id: itemId },
      include: {
        auction: true,
      },
    });

    if (!item) {
      throw new Error(BidErrors.ITEM_NOT_FOUND);
    }
    if (item.sellerId === bidderId) {
      throw new Error(BidErrors.CANNOT_BID_OWN_ITEM);
    }

    const now = new Date();
    const auction = item.auction;

    if (auction.status === "SCHEDULED" || now < auction.startTime) {
      throw new Error(BidErrors.AUCTION_NOT_STARTED);
    }
    if (now >= auction.endTime || auction.status === "ENDED") {
      throw new Error(BidErrors.AUCTION_ENDED);
    }
    if (auction.status !== "LIVE") {
      throw new Error(BidErrors.AUCTION_NOT_LIVE);
    }

    const startingPrice = Number(item.startingPrice);
    const currentBid =
      item.currentBid === null ? null : Number(item.currentBid);

    if (currentBid === null) {
      if (amount < startingPrice) {
        throw new Error(BidErrors.BID_BELOW_START);
      }
    } else if (amount <= currentBid) {
      throw new Error(BidErrors.BID_TOO_LOW);
    }

    const currentHighBid = await tx.bid.findFirst({
      where: { itemId, status: "ACTIVE" },
      select: { bidderId: true },
    });

    if (currentHighBid?.bidderId === bidderId) {
      throw new Error(BidErrors.ALREADY_HIGH_BIDDER);
    }

    await tx.bid.updateMany({
      where: { itemId, status: "ACTIVE" },
      data: { status: "OUTBID" },
    });

    const bid = await tx.bid.create({
      data: {
        itemId,
        bidderId,
        amount,
        status: "ACTIVE",
      },
    });

    await tx.item.update({
      where: { id: itemId },
      data: { currentBid: amount },
    });
    return bid;
  });
}

export async function getItemBids(itemId: string) {
  await syncAuctionStatuses();

  const item = await prisma.item.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new Error(BidErrors.ITEM_NOT_FOUND);
  }
  return prisma.bid.findMany({
    where: { itemId },
    orderBy: { placedAt: "desc" },
    select: {
      id: true,
      amount: true,
      status: true,
      placedAt: true,
      bidder: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function getMyBids(bidderId: string) {
  await syncAuctionStatuses();

  return prisma.bid.findMany({
    where: { bidderId },
    orderBy: { placedAt: "desc" },
    select: {
      id: true,
      amount: true,
      status: true,
      placedAt: true,
      item: {
        select: {
          id: true,
          title: true,
          currentBid: true,
          startingPrice: true,
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
      },
    },
  });
}
