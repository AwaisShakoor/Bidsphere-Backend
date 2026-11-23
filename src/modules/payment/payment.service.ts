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
    success_url: `${process.env.FRONTEND_URL}/payments/success?itemId=${params.itemId}&session_id={CHECKOUT_SESSION_ID}`,
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
      deliveryStatus: "AWAITING_SHIPMENT",
      paidAt: new Date(),
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    },
  });

  const payment = await prisma.payment.findUnique({
    where: { itemId },
    select: {
      auctionId: true,
      itemId: true,
      buyerId: true,
      sellerId: true,
      status: true,
      sellerPayout: true,
      stripeTransferId: true,
      item: { select: { title: true } },
      seller: { select: { stripeAccountId: true } },
    },
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

  const title = payment.item.title;

  try {
    await prisma.notification.create({
      data: {
        userId: payment.buyerId,
        type: "AUCTION_WON",
        title: "Payment Successful",
        message: `Your payment for "${title}" is complete.`,
        auctionId: payment.auctionId,
        itemId: payment.itemId,
      },
    });
  } catch (err) {
    console.error("Buyer notification failed:", err);
  }

  try {
    await prisma.notification.create({
      data: {
        userId: payment.sellerId,
        type: "AUCTION_SOLD",
        title: "Buyer paid — ship item",
        message: `Buyer paid for "${title}". Mark as shipped when you send it.`,
        auctionId: payment.auctionId,
        itemId: payment.itemId,
      },
    });
  } catch (err) {
    console.error("Seller notification failed:", err);
  }
}

export async function getMyPayouts(sellerId: string) {
  return await prisma.payment.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      platformFee: true,
      sellerPayout: true,
      currency: true,
      status: true,
      stripeTransferId: true,
      deliveryStatus: true,
      shippedAt: true,
      trackingNote: true,
      paidAt: true,
      createdAt: true,
      item: { select: { id: true, title: true } },
      auction: { select: { id: true, title: true } },
      buyer: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
}

export async function confirmCheckout(
  itemId: string,
  buyerId: string,
  sessionIdFromClient: string,
) {
  const payment = await prisma.payment.findUnique({
    where: { itemId },
  });

  if (!payment) {
    throw new Error(PaymentErrors.PAYMENT_NOT_FOUND);
  }
  if (payment.buyerId !== buyerId) {
    throw new Error(PaymentErrors.FORBIDDEN);
  }

  if (payment.status === "COMPLETED") {
    return payment;
  }
  if (payment.status === "FAILED") {
    throw new Error(PaymentErrors.PAYMENT_EXPIRED);
  }

  const sessionId = sessionIdFromClient?.startsWith("cs_")
    ? sessionIdFromClient
    : payment.stripePaymentIntentId;
  if (!sessionId?.startsWith("cs_")) {
    throw new Error(PaymentErrors.INVALID_SESSION);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.itemId && session.metadata.itemId !== itemId) {
    throw new Error(PaymentErrors.FORBIDDEN);
  }

  if (session.payment_status !== "paid") {
    throw new Error(PaymentErrors.PAYMENT_NOT_PAID);
  }

  await handleCheckoutCompleted({
    metadata: (session.metadata as Record<string, string> | null) ?? {
      itemId,
    },
    payment_intent: session.payment_intent,
  });

  const updated = await prisma.payment.findUnique({ where: { itemId } });
  if (!updated) {
    throw new Error(PaymentErrors.PAYMENT_NOT_FOUND);
  }
  return updated;
}

export async function markAsShipper(
  itemId: string,
  sellerId: string,
  trackingNote?: string,
) {
  const payment = await prisma.payment.findUnique({ where: { itemId } });
  if (!payment) {
    throw new Error(PaymentErrors.PAYMENT_NOT_FOUND);
  }
  if (payment.sellerId !== sellerId) {
    throw new Error(PaymentErrors.FORBIDDEN);
  }
  if (
    payment.deliveryStatus === "SHIPPED" ||
    payment.deliveryStatus === "DELIVERED"
  ) {
    throw new Error(PaymentErrors.ALREADY_SHIPPED);
  }

  if (payment.deliveryStatus !== "AWAITING_SHIPMENT") {
    throw new Error(PaymentErrors.INVALID_DELIVERY_STATE);
  }

  const updated = await prisma.payment.update({
    where: { itemId },
    data: {
      deliveryStatus: "SHIPPED",
      shippedAt: new Date(),
      trackingNote,
    },
  });

  try {
    await prisma.notification.create({
      data: {
        userId: payment.buyerId,
        type: "ITEM_SHIPPED",
        title: "Item shipped",
        message: trackingNote
          ? `Your item was shipped. Note: ${trackingNote}`
          : "Your item was marked as shipped.",
        auctionId: payment.auctionId,
        itemId: payment.itemId,
      },
    });
  } catch (err) {
    console.error("Buyer notification failed:", err);
  }

  return updated;
}

export async function markAsDelivered(buyerId: string, itemId: string) {
  const payment = await prisma.payment.findUnique({
    where: { itemId },
    include: {
      item: { select: { title: true } },
      seller: { select: { stripeAccountId: true } },
    },
  });
  if (!payment) {
    throw new Error(PaymentErrors.PAYMENT_NOT_FOUND);
  }
  if (payment.buyerId !== buyerId) {
    throw new Error(PaymentErrors.FORBIDDEN);
  }
  if (payment.status !== "COMPLETED") {
    throw new Error(PaymentErrors.INVALID_DELIVERY_STATE);
  }
  if (payment.deliveryStatus !== "SHIPPED") {
    throw new Error(PaymentErrors.INVALID_DELIVERY_STATE);
  }

  await prisma.payment.update({
    where: { itemId },
    data: {
      deliveryStatus: "DELIVERED",
      deliveredAt: new Date(),
    },
  });

  try {
    await prisma.notification.create({
      data: {
        userId: payment.sellerId,
        type: "ITEM_DELIVERED",
        title: "Item delivered",
        message: `Your item "${payment.item.title}" has been delivered.`,
        auctionId: payment.auctionId,
        itemId: payment.itemId,
      },
    });
  } catch (err) {
    console.error("Seller notification failed:", err);
  }

  if (!payment.stripeTransferId && payment.seller.stripeAccountId) {
    const transfer = await stripe.transfers.create({
      amount: toCents(Number(payment.sellerPayout)),
      currency: "usd",
      destination: payment.seller.stripeAccountId,
    });

    return prisma.payment.update({
      where: { itemId },
      data: { stripeTransferId: transfer.id },
    });
  }
  if (!payment.seller.stripeAccountId) {
    throw new Error(PaymentErrors.STRIPE_NOT_CONNECTED);
  }
  return prisma.payment.findUnique({ where: { itemId } });
}
