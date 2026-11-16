import { Request, Response } from "express";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./notification.service";

export async function getMyNotificationsController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user!.userId;
    const notifications = await getMyNotifications(userId);
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function markNotificationAsReadController(
  req: Request,
  res: Response,
) {
  try {
    const notificationId = req.params.notificationId as string;
    const userId = req.user!.userId;
    const notification = await markNotificationAsRead(userId, notificationId);
    return res
      .status(200)
      .json({ message: "Notification marked as read", notification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NOTIFICATION_NOT_FOUND") {
      return res.status(404).json({ message: "Notification not found" });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function markAllNotificationsAsReadController(
  req: Request,
  res: Response,
) {
  try {
    const userId = req.user!.userId;
    const count = await markAllNotificationsAsRead(userId);
    return res.status(200).json({ message: "All notifications marked as read", count });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
