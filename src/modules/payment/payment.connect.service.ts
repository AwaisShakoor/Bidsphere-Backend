import { prisma } from "../../config/db";
import stripe from "../../config/stripe";

export async function createConnectOnboardingLink(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      stripeAccountId: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  let accountId = user.stripeAccountId;

  if (!accountId) {
    const account = await stripe.v2.core.accounts.create({
      contact_email: user.email,
      display_name: user.email,
      dashboard: "express",
      identity: {
        country: "us",
      },
      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                requested: true,
              },
            },
          },
        },
      },
      include: ["configuration.recipient", "identity", "requirements"],
    });

    accountId = account.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeAccountId: accountId },
    });
  }

  await stripe.balanceSettings.update(
    {
      payments: {
        payouts: {
          schedule: {
            interval: "manual",
          },
        },
      },
    },
    {
      stripeAccount: accountId,
    },
  );

  const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
  const link = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        refresh_url: `${frontend}/seller/stripe/refresh`,
        return_url: `${frontend}/seller/stripe/return`,
        collection_options: {
          fields: "eventually_due",
        },
      },
    },
  });

  return { url: link.url, stripeAccountId: accountId };
}

export async function getConnectionStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      stripeAccountId: true,
    },
  });

  if (!user?.stripeAccountId) {
    return {
      connected: false,
      payoutEnabled: false,
      chargesEnabled: false,
      stripeAccountId: null,
    };
  }

  const account = await stripe.v2.core.accounts.retrieve(user.stripeAccountId, {
    include: ["configuration.recipient", "requirements"],
  });

  const transferStatus =
    account.configuration?.recipient?.capabilities?.stripe_balance
      ?.stripe_transfers?.status;

  const payoutEnabled = transferStatus === "active";

  return {
    connected: payoutEnabled,
    payoutEnabled,
    chargesEnabled: false,
    stripeAccountId: user.stripeAccountId,
  };
}

export async function getSellerStripeAccountId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeAccountId: true,
    },
  });

  if (!user?.stripeAccountId) {
    throw new Error("Stripe Connect is not set up");
  }

  return user.stripeAccountId;
}

export async function getConnectBalance(userId: string) {
  const accountId = await getSellerStripeAccountId(userId);
  const balance = await stripe.balance.retrieve(
    {},
    { stripeAccount: accountId },
  );
  const availableBalance = balance.available.find(
    (balance) => balance.currency === "usd",
  );
  const pendingBalance = balance.pending.find(
    (balance) => balance.currency === "usd",
  );
  return {
    currency: "usd",
    available: (availableBalance?.amount ?? 0) / 100,
    pending: (pendingBalance?.amount ?? 0) / 100,
  };
}

export async function createConnectWithdraw(
  userId: string,
  amountDollars?: number,
) {
  const accountId = await getSellerStripeAccountId(userId);
  const status = await getConnectionStatus(userId);
  if (!status.payoutEnabled) {
    throw new Error("Stripe Connect is not set up");
  }
  const balance = await getConnectBalance(userId);
  const amount =
    amountDollars === undefined ? balance.available : Number(amountDollars);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid withdraw amount");
  }
  if (amount > balance.available) {
    throw new Error("Insufficient available balance");
  }
  const amountCents = Math.round(amount * 100);
  try {
    const payout = await stripe.payouts.create(
      {
        amount: amountCents,
        currency: "usd",
      },
      { stripeAccount: accountId },
    );
    return {
      payoutId: payout.id,
      amount: amountCents / 100,
      currency: payout.currency,
      status: payout.status,
      arrivalDate: payout.arrival_date
        ? new Date(payout.arrival_date * 1000).toISOString()
        : null,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Stripe withdraw failed: ${detail}`);
  }
}
