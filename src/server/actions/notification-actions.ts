"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function markNotificationReadAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const notificationId = String(formData.get("notificationId") ?? "");
  if (!notificationId) return;

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      companyId: user.companyId
    },
    data: {
      readAt: new Date()
    }
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function markAllNotificationsReadAction() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  await prisma.notification.updateMany({
    where: {
      companyId: user.companyId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
