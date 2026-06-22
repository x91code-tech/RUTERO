import { prisma } from "@/lib/db";
import { endOfLocalDay, startOfLocalDay } from "@/lib/date-utils";

const CLOSE_REMINDER_TITLE = "Cierre de caja pendiente";

export async function ensureCashboxCloseReminder(companyId: string, now = new Date()) {
  if (now.getHours() < 22) return;

  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const openCashboxes = await prisma.cashbox.count({
    where: {
      companyId,
      date: {
        gte: todayStart,
        lt: todayEnd
      },
      status: "OPEN"
    }
  });

  if (openCashboxes === 0) return;

  const existingReminder = await prisma.notification.findFirst({
    where: {
      companyId,
      title: CLOSE_REMINDER_TITLE,
      createdAt: {
        gte: todayStart,
        lt: todayEnd
      }
    },
    select: { id: true }
  });

  if (existingReminder) return;

  await prisma.notification.create({
    data: {
      companyId,
      title: CLOSE_REMINDER_TITLE,
      message: `Son mas de las 10:00 pm y hay ${openCashboxes} caja${openCashboxes === 1 ? "" : "s"} abierta${openCashboxes === 1 ? "" : "s"}. Cierra caja para guardar el arrastre de manana.`,
      severity: "warning"
    }
  });
}
