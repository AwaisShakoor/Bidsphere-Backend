import { prisma } from "../../config/db";
import stripe from "../../config/stripe";
import { Prisma } from "../../../generated/prisma/client";

const PAYMENT_DEADLINE_HOURS = 48;
const PAYMENT_REMINDER_HOURS_BEFORE_EXPIRY = 24;

function getPlatformFeePercent() {
  return Number(process.env.PLATFORM_FEE_PERCENT) || 5;
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

export async function retryPendingTransfers() {
  const payments = await prisma.payment.findMany({
    where: {
      status: "COMPLETED",
      stripeTransferId: null,
      deliveryStatus: "DELIVERED",
      seller: { stripeAccountId: { not: null } },
    },
    select: {
      id: true,
      itemId: true,
      auctionId: true,
      sellerId: true,
      sellerPayout: true,
      item: { select: { title: true } },
      seller: { select: { stripeAccountId: true } },
    },
    take: 20,
  });

  for (const payment of payments) {
    const accountId = payment.seller.stripeAccountId;
    if (!accountId) continue;

    try {
      const transfer = await stripe.transfers.create({
        amount: toCents(Number(payment.sellerPayout)),
        currency: "usd",
        destination: accountId,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { stripeTransferId: transfer.id },
      });

      await prisma.notification.create({
        data: {
          userId: payment.sellerId,
          type: "AUCTION_SOLD",
          title: "Payment received",
          message: `Buyer completed payment for "${payment.item.title}".`,
          auctionId: payment.auctionId,
          itemId: payment.itemId,
        },
      });
    } catch (err) {
      console.error(
        "retryPendingTransfers failed for payment",
        payment.id,
        err,
      );
    }
  }
}

async function markAuctionNoSale(
  tx: Prisma.TransactionClient,
  auctionId: string,
) {
  const pending = await tx.payment.count({
    where: { auctionId, status: "PENDING" },
  });
  const completed = await tx.payment.count({
    where: { auctionId, status: "COMPLETED" },
  });
  if (pending === 0 && completed === 0) {
    await tx.auction.update({
      where: { id: auctionId },
      data: { status: "NO_SALE" },
    });
  }
}

export async function expireOverduePayments() {
  const overdue = await prisma.payment.findMany({
    where: { status: "PENDING", paymentDeadline: { lt: new Date() } },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      auctionId: true,
      itemId: true,
      runnerUpNotified: true,
      item: {
        select: {
          title: true,
          reservePrice: true,
          bids: {
            orderBy: { amount: "desc" },
            select: {
              id: true,
              bidderId: true,
              amount: true,
              status: true,
            },
          },
        },
      },
    },
  });

  for (const payment of overdue) {
    await prisma.$transaction(async (tx) => {
      const title = payment.item.title;

      // Always: current buyer + seller — deadline missed
      await tx.notification.create({
        data: {
          userId: payment.buyerId,
          type: "PAYMENT_EXPIRED",
          title: "Payment deadline passed",
          message: `Your payment for "${title}" has expired.`,
          auctionId: payment.auctionId,
          itemId: payment.itemId,
          isRead: false,
        },
      });
      await tx.notification.create({
        data: {
          userId: payment.sellerId,
          type: "PAYMENT_EXPIRED",
          title: "Buyer did not pay",
          message: `The buyer did not pay for "${title}" within the deadline.`,
          auctionId: payment.auctionId,
          itemId: payment.itemId,
          isRead: false,
        },
      });

      // First miss → offer runner-up once
      if (!payment.runnerUpNotified) {
        const reserve =
          payment.item.reservePrice === null
            ? null
            : Number(payment.item.reservePrice);

        const runnerUp = payment.item.bids.find((b) => {
          if (b.bidderId === payment.buyerId) return false;
          if (b.status !== "LOST") return false;
          const amount = Number(b.amount);
          return reserve === null || amount >= reserve;
        });

        if (runnerUp) {
          const amount = Number(runnerUp.amount);
          const feePercent = getPlatformFeePercent();
          const platformFee = Number(((amount * feePercent) / 100).toFixed(2));
          const sellerPayout = Number((amount - platformFee).toFixed(2));

          await tx.bid.updateMany({
            where: { itemId: payment.itemId, status: "WON" },
            data: { status: "LOST" },
          });
          await tx.bid.update({
            where: { id: runnerUp.id },
            data: { status: "WON" },
          });
          await tx.item.update({
            where: { id: payment.itemId },
            data: { winnerId: runnerUp.bidderId },
          });
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "PENDING",
              buyerId: runnerUp.bidderId,
              amount,
              platformFee,
              sellerPayout,
              paymentDeadline: new Date(
                Date.now() + PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000,
              ),
              stripePaymentIntentId: `pending_runner_${payment.itemId}`,
              runnerUpNotified: true,
            },
          });

          // Runner-up notification
          await tx.notification.create({
            data: {
              userId: runnerUp.bidderId,
              type: "AUCTION_WON",
              title: "Second chance offer",
              message: `You can now buy "${title}". Please pay within 48 hours.`,
              auctionId: payment.auctionId,
              itemId: payment.itemId,
              isRead: false,
            },
          });
          // Seller notification
          await tx.notification.create({
            data: {
              userId: payment.sellerId,
              type: "AUCTION_SOLD",
              title: "Second chance offer sent",
              message: `A second chance offer was sent for "${title}".`,
              auctionId: payment.auctionId,
              itemId: payment.itemId,
              isRead: false,
            },
          });
          return;
        }

        // No runner-up
        await tx.bid.updateMany({
          where: { itemId: payment.itemId, status: "WON" },
          data: { status: "LOST" },
        });
        await tx.item.update({
          where: { id: payment.itemId },
          data: { winnerId: null },
        });
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED", runnerUpNotified: true },
        });
        await markAuctionNoSale(tx, payment.auctionId);
        return;
      }

      // Runner-up also missed
      await tx.bid.updateMany({
        where: { itemId: payment.itemId, status: "WON" },
        data: { status: "LOST" },
      });
      await tx.item.update({
        where: { id: payment.itemId },
        data: { winnerId: null },
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      await markAuctionNoSale(tx, payment.auctionId);
    });
  }
}

export async function sendPaymentReminders() {
  const now = new Date();
  const within = new Date(
    now.getTime() + PAYMENT_REMINDER_HOURS_BEFORE_EXPIRY * 60 * 60 * 1000,
  );

  const dueSoon = await prisma.payment.findMany({
    where: { status: "PENDING", paymentDeadline: { gt: now, lte: within } },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      auctionId: true,
      itemId: true,
      item: { select: { title: true } },
    },
  });

  for (const payment of dueSoon) {
    const alreadySent = await prisma.notification.findFirst({
      where: {
        userId: payment.buyerId,
        itemId: payment.itemId,
        type: "PAYMENT_REMINDER",
      },
      select: { id: true },
    });
    if (alreadySent) continue;

    await prisma.$transaction(async (tx) => {
      await tx.notification.create({
        data: {
          userId: payment.buyerId,
          type: "PAYMENT_REMINDER",
          title: "Payment Reminder",
          message: `You have less than 24 hours left to pay for "${payment.item.title}".`,
          auctionId: payment.auctionId,
          itemId: payment.itemId,
          isRead: false,
        },
      });
    });
  }
}
