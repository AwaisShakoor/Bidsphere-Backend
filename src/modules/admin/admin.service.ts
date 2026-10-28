import { prisma } from "../../config/db";

export async function getUsers() {
  return prisma.user.findMany({
    where: {
      role: { in: ["SELLER", "BUYER"] },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllAuctions() {
  return prisma.auction.findMany({
    where: { status: "PENDING_APPROVAL" },
    select: {
      id: true,
      status: true,
      title: true,
      description: true,
      startTime: true,
      endTime: true,
      rejectionReason: true,
      createdAt: true,
      seller: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        select: {
          id: true,
          title: true,
          startingPrice: true,
          images: {
            select: {
              id: true,
              url: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAuctionById(auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: {
      id: true,
      status: true,
      title: true,
      description: true,
      startTime: true,
      endTime: true,
      rejectionReason: true,
      createdAt: true,
      seller: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        select: {
          id: true,
          title: true,
          description: true,
          itemCondition: true,
          startingPrice: true,
          reservePrice: true,
          shippingType: true,
          shippingCost: true,
          shippingEstimatedDays: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
            },
          },
        },
      },
    },
  });
  return auction;
}

export async function approveAuction(auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  if (auction.status !== "PENDING_APPROVAL") {
    throw new Error("Auction is not pending approval");
  }

  return prisma.auction.update({
    where: { id: auctionId },
    data: { status: "ACTIVE" },
    select: {
      id: true,
      status: true,
      title: true,
    },
  });
}

export async function rejectAuction(
  auctionId: string,
  rejectionReason: string,
) {
  if (!rejectionReason?.trim()) {
    throw new Error("Rejection reason is required");
  }

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    throw new Error("Auction not found");
  }

  if (auction.status !== "PENDING_APPROVAL") {
    throw new Error("Auction is not pending approval");
  }

  return prisma.auction.update({
    where: { id: auctionId },
    data: { status: "REJECTED", rejectionReason: rejectionReason },
    select: {
      id: true,
      status: true,
      title: true,
      rejectionReason: true,
    },
  });
}

export async function getOverviews() {
  const [
    pendingApproval,
    activeAuctions,
    rejectedAuctions,
    completedAuctions,
    sellers,
    buyers,
  ] = await Promise.all([
    prisma.auction.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.auction.count({ where: { status: "ACTIVE" } }),
    prisma.auction.count({ where: { status: "REJECTED" } }),
    prisma.auction.count({ where: { status: "COMPLETED" } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { role: "BUYER" } }),
  ]);

  return {
    auctions: {
      pendingApproval,
      activeAuctions,
      rejectedAuctions,
      completedAuctions,
    },
    users: {
      sellers,
      buyers,
    },
  };
}
