import { Request, Response } from "express";
import {
  confirmCheckout,
  createCheckout,
  getItemPayment,
  getMyPayments,
  getMyPayouts,
  markAsDelivered,
  markAsShipper,
} from "./payment.service";
import { handlePaymentError } from "./payment.errors";
import {
  createConnectOnboardingLink,
  createConnectWithdraw,
  getConnectBalance,
  getConnectionStatus,
} from "./payment.connect.service";

export async function createCheckoutController(req: Request, res: Response) {
  try {
    const buyerId = req.user!.userId;
    const itemId = req.params.itemId as string;
    const result = await createCheckout(itemId, buyerId);
    return res.status(201).json({
      payment: result.payment,
      url: result.url,
    });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}

export async function getItemPaymentController(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const itemId = req.params.itemId as string;
    const payment = await getItemPayment(itemId, userId);
    return res.status(200).json({ payment });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}

export async function getMyPaymentsController(req: Request, res: Response) {
  try {
    const buyerId = req.user!.userId;
    const payments = await getMyPayments(buyerId);
    return res.status(200).json({ payments });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}

export async function createConnectOnboardingLinkController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user!.userId;
    const result = await createConnectOnboardingLink(userId);
    return res
      .status(200)
      .json({ message: "Onboarding link created successfully", result });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}

export async function getConnectionStatusController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user!.userId;
    const result = await getConnectionStatus(userId);
    return res
      .status(200)
      .json({ message: "Connection status retrieved successfully", result });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}

export async function getMyPayoutsController(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const payouts = await getMyPayouts(sellerId);
    return res.status(200).json({ payouts });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}

export async function getConnectBalanceController(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const result = await getConnectBalance(userId);
    return res.status(200).json({ message: "Balance retrieved", result });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}

export async function createConnectWithdrawController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user!.userId;
    const amount =
      req.body?.amount !== undefined ? Number(req.body.amount) : undefined;
    const result = await createConnectWithdraw(userId, amount);
    return res.status(200).json({
      message: "Withdraw started. Funds usually arrive in 1–2 business days.",
      result,
    });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}

export async function confirmCheckoutController(req: Request, res: Response) {
  try {
    const buyerId = req.user!.userId;
    const itemId = req.params.itemId as string;
    const sessionId =
      typeof req.body?.sessionId === "string" ? req.body.sessionId : undefined;
    const payment = await confirmCheckout(itemId, buyerId, sessionId);
    return res.status(200).json({ payment });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}

export async function markAsShippedController(req: Request, res: Response) {
  try {
    const sellerId = req.user!.userId;
    const itemId = req.params.itemId as string;
    const trackingNote = req.body?.trackingNote as string | undefined;
    const payment = await markAsShipper(itemId, sellerId, trackingNote);
    return res.status(200).json({ message: "Item marked as shipped", payment });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}

export async function markAsDeliveredController(req: Request, res: Response) {
  try {
    const buyerId = req.user!.userId;
    const itemId = req.params.itemId as string;
    const payment = await markAsDelivered(buyerId, itemId);
    return res
      .status(200)
      .json({ message: "Item marked as delivered", payment });
  } catch (error) {
    return handlePaymentError(error, res);
  }
}
