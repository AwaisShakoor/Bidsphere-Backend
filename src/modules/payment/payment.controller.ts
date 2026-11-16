import { Request, Response } from "express";
import {
  createCheckout,
  getItemPayment,
  getMyPayments,
} from "./payment.service";
import { handlePaymentError } from "./payment.errors";

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
