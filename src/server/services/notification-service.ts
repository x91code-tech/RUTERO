import { prisma } from "@/lib/db";

export type NotificationSeverity = "info" | "warning" | "critical";

export async function createNotification(input: {
  companyId: string;
  title: string;
  message: string;
  severity?: NotificationSeverity;
}) {
  return prisma.notification.create({
    data: {
      companyId: input.companyId,
      title: input.title,
      message: input.message,
      severity: input.severity ?? "info"
    }
  });
}
