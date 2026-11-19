import { Response } from "express";

export const PaymentErrors = {
  ITEM_NOT_FOUND: "Item not found",
  NOT_WINNER: "Only the winner can pay for this item",
  NO_WINNING_BID: "No winning bid found for this item",
  PAYMENT_ALREADY_COMPLETED: "Payment already completed",
  PAYMENT_NOT_FOUND: "Payment not found",
  FORBIDDEN: "You are not allowed to view this payment",
  PAYMENT_EXPIRED: "Payment deadline has passed",
  USER_NOT_FOUND: "User not found",
  STRIPE_CONNECT_FAILED: "Stripe Connect request failed",
  STRIPE_NOT_CONNECTED: "Stripe Connect is not set up",
  INSUFFICIENT_BALANCE: "Insufficient available balance",
  INVALID_WITHDRAW_AMOUNT: "Invalid withdraw amount",
  STRIPE_WITHDRAW_FAILED: "Stripe withdraw failed",
} as const;

export function handlePaymentError(error: unknown, res: Response) {
  const message =
    error instanceof Error ? error.message : "Internal server error";

  if (
    message === PaymentErrors.ITEM_NOT_FOUND ||
    message === PaymentErrors.PAYMENT_NOT_FOUND
  ) {
    return res.status(404).json({ message });
  }

  if (
    message === PaymentErrors.FORBIDDEN ||
    message === PaymentErrors.NOT_WINNER
  ) {
    return res.status(403).json({ message });
  }

  if (
    message === PaymentErrors.NO_WINNING_BID ||
    message === PaymentErrors.PAYMENT_ALREADY_COMPLETED ||
    message === PaymentErrors.PAYMENT_EXPIRED ||
    message === PaymentErrors.USER_NOT_FOUND ||
    message === PaymentErrors.STRIPE_CONNECT_FAILED ||
    message === PaymentErrors.STRIPE_NOT_CONNECTED ||
    message === PaymentErrors.INSUFFICIENT_BALANCE ||
    message === PaymentErrors.INVALID_WITHDRAW_AMOUNT ||
    message === PaymentErrors.STRIPE_WITHDRAW_FAILED
  ) {
    return res.status(400).json({ message });
  }

  console.error(error);
  return res.status(500).json({
    message: PaymentErrors.STRIPE_CONNECT_FAILED,
    detail: message,
  });
}
