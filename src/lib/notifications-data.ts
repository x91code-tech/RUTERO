import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { demoNotifications } from "@/lib/demo-data";
import type { Notification } from "@/lib/types";
import { ensureCashboxCloseReminder } from "@/lib/cashbox-alerts";

function toNotification(notification: {
  id: string;
  companyId: string;
  title: string;
  message: string;
  severity: string;
  readAt: Date | null;
  createdAt: Date;
}): Notification {
  return {
    id: notification.id,
    companyId: notification.companyId,
    title: notification.title,
    message: notification.message,
    severity: notification.severity as Notification["severity"],
    readAt: notification.readAt?.toISOString(),
    createdAt: notification.createdAt.toISOString()
  };
}

export async function getNotificationsData() {
  const user = await getSessionUser();
  if (!user) {
    return {
      notifications: demoNotifications,
      unreadCount: demoNotifications.length
    };
  }

  await ensureCashboxCloseReminder(user.companyId);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.notification.count({
      where: {
        companyId: user.companyId,
        readAt: null
      }
    })
  ]);

  return {
    notifications: notifications.map(toNotification),
    unreadCount
  };
}

export async function getNotificationSummary() {
  const user = await getSessionUser();
  if (!user) return { unreadCount: demoNotifications.length };

  await ensureCashboxCloseReminder(user.companyId);

  const unreadCount = await prisma.notification.count({
    where: {
      companyId: user.companyId,
      readAt: null
    }
  });

  return { unreadCount };
}
