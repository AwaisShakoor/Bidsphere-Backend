import { Response } from "express";

export const PaymentErrors = {
  ITEM_NOT_FOUND: "Item not found",
  NOT_WINNER: "Only the winner can pay for this item",
  NO_WINNING_BID: "No winning bid found for this item",
  PAYMENT_ALREADY_COMPLETED: "Payment already completed",
  PAYMENT_NOT_FOUND: "Payment not found",
  FORBIDDEN: "You are not allowed to view this payment",
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
    message === PaymentErrors.PAYMENT_ALREADY_COMPLETED
  ) {
    return res.status(400).json({ message });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}
