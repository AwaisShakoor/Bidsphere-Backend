import { prisma } from "../../config/db";

export async function getMyNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      isRead: true,
      createdAt: true,
      auctionId: true,
      itemId: true,
    },
  });
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });

  if (result.count === 0) {
    throw new Error("NOTIFICATION_NOT_FOUND");
  }

  return prisma.notification.findUnique({
    where: { id: notificationId },
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      isRead: true,
      auctionId: true,
      itemId: true,
      createdAt: true,
    },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId },
    data: { isRead: true },
  });
  return result.count;
}
