import { prisma } from "../../config/db";
import stripe from "../../config/stripe";
import { PaymentErrors } from "./payment.errors";
import { Prisma } from "../../../generated/prisma/client";

const PAYMENT_DEADLINE_HOURS = 48;

function getPlatformFeePercent() {
  return Number(process.env.PLATFORM_FEE_PERCENT) || 5;
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

//create job to check for expired payments and cancel them
export async function expireOverduePayments() {
  await prisma.payment.updateMany({
    where: { status: "PENDING", paymentDeadline: { lt: new Date() } },
    data: { status: "FAILED" },
  });
}

async function createCheckoutSession(params: {
  itemId: string;
  title: string;
  amount: number;
  auctionId: string;
  buyerId: string;
  sellerId: string;
  customerEmail: string;
}) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.customerEmail,
    payment_intent_data: {
      receipt_email: params.customerEmail,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: toCents(params.amount),
          product_data: { name: params.title },
        },
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/payments/success?itemId=${params.itemId}`,
    cancel_url: `${process.env.FRONTEND_URL}/payments/cancel?itemId=${params.itemId}`,
    metadata: {
      itemId: params.itemId,
      auctionId: params.auctionId,
      buyerId: params.buyerId,
      sellerId: params.sellerId,
    },
  });
}

export async function createCheckout(itemId: string, buyerId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      auction: true,
      winner: { select: { email: true } },
      bids: {
        where: { status: "WON", bidderId: buyerId },
        take: 1,
      },
    },
  });

  if (!item) {
    throw new Error(PaymentErrors.ITEM_NOT_FOUND);
  }
  if (item.winnerId !== buyerId) {
    throw new Error(PaymentErrors.NOT_WINNER);
  }

  const winningBid = item.bids[0];
  if (!winningBid) {
    throw new Error(PaymentErrors.NO_WINNING_BID);
  }

  const existing = await prisma.payment.findUnique({
    where: { itemId },
  });

  if (existing?.status === "COMPLETED") {
    throw new Error(PaymentErrors.PAYMENT_ALREADY_COMPLETED);
  }

  if (existing?.status === "FAILED") {
    throw new Error(PaymentErrors.PAYMENT_EXPIRED);
  }

  if (existing?.status === "PENDING" && existing.paymentDeadline < new Date()) {
    await prisma.payment.update({
      where: { itemId },
      data: { status: "FAILED" },
    });
    throw new Error(PaymentErrors.PAYMENT_EXPIRED);
  }

  const amount = Number(winningBid.amount);
  const session = await createCheckoutSession({
    itemId,
    title: item.title,
    amount,
    auctionId: item.auctionId,
    buyerId,
    sellerId: item.sellerId,
    customerEmail: item.winner!.email,
  });

  if (existing?.status === "PENDING") {
    const payment = await prisma.payment.update({
      where: { itemId },
      data: { stripePaymentIntentId: session.id },
    });
    return { payment, url: session.url };
  }

  const feePercent = getPlatformFeePercent();
  const platformFee = Number(((amount * feePercent) / 100).toFixed(2));
  const sellerPayout = Number((amount - platformFee).toFixed(2));
  const paymentDeadline = new Date(
    Date.now() + PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000,
  );

  try {
    const payment = await prisma.payment.create({
      data: {
        auctionId: item.auctionId,
        itemId,
        buyerId,
        sellerId: item.sellerId,
        amount,
        platformFee,
        sellerPayout,
        stripePaymentIntentId: session.id,
        status: "PENDING",
        paymentDeadline,
      },
    });
    return { payment, url: session.url };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const payment = await prisma.payment.update({
        where: { itemId },
        data: { stripePaymentIntentId: session.id },
      });
      return { payment, url: session.url };
    }
    throw error;
  }
}

export async function getItemPayment(itemId: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { itemId },
    include: {
      item: { select: { id: true, title: true } },
    },
  });

  if (!payment) {
    throw new Error(PaymentErrors.PAYMENT_NOT_FOUND);
  }

  if (payment.buyerId !== userId && payment.sellerId !== userId) {
    throw new Error(PaymentErrors.FORBIDDEN);
  }

  return payment;
}

export async function getMyPayments(buyerId: string) {
  return await prisma.payment.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    include: {
      item: { select: { id: true, title: true } },
      auction: { select: { id: true, title: true } },
    },
  });
}

export async function handleCheckoutCompleted(session: {
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id: string } | null;
}) {
  const itemId = session.metadata?.itemId;
  if (!itemId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await prisma.payment.updateMany({
    where: { itemId, status: "PENDING" },
    data: {
      status: "COMPLETED",
      paidAt: new Date(),
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    },
  });

  const payment = await prisma.payment.findUnique({
    where: { itemId },
    select: { auctionId: true, status: true },
  });

  if (!payment || payment.status !== "COMPLETED") return;

  const pendingLeft = await prisma.payment.count({
    where: { auctionId: payment.auctionId, status: "PENDING" },
  });

  if (pendingLeft === 0) {
    await prisma.auction.update({
      where: { id: payment.auctionId },
      data: { status: "COMPLETED" },
    });
  }
}
