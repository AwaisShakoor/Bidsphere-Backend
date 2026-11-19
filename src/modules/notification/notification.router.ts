import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  getMyNotificationsController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "./notification.controller";

const notificationRouter = Router();

notificationRouter.get(
  "/me/notifications",
  authMiddleware,
  getMyNotificationsController,
);

notificationRouter.patch(
  "/me/notifications/:notificationId/read",
  authMiddleware,
  markNotificationAsReadController,
);

notificationRouter.patch(
  "/me/notifications/read-all",
  authMiddleware,
  markAllNotificationsAsReadController,
);

export default notificationRouter;
