import { NextResponse } from "next/server";
import { endOfLocalDay, startOfLocalDay } from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import { mobileError, mobileOk, requireMobileUser } from "@/lib/mobile-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireMobileUser(request);
  if (user instanceof NextResponse) return user;
  if (!["SELLER", "SUPERVISOR", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return mobileError("No tienes permiso para ver ruta movil.", 403);
  }

  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const sellerId = new URL(request.url).searchParams.get("sellerId") || user.id;
  const scopedSellerId = user.role === "SELLER" ? user.id : sellerId;

  const [company, route, clients, collections, cashbox, expenses] = await Promise.all([
    prisma.company.findUnique({
      where: { id: user.companyId },
      select: { id: true, name: true, countryCode: true, currencyCode: true, locale: true, timeZone: true }
    }),
    prisma.route.findFirst({
      where: { companyId: user.companyId, sellerId: scopedSellerId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, zone: true }
    }),
    prisma.client.findMany({
      where: {
        companyId: user.companyId,
        sellerId: scopedSellerId,
        status: { in: ["ACTIVE", "DELINQUENT"] },
        loans: { some: { status: "ACTIVE" } }
      },
      include: {
        loans: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 1 },
        collections: {
          where: {
            OR: [{ date: { gte: todayStart, lt: todayEnd } }, { createdAt: { gte: todayStart, lt: todayEnd } }]
          }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.collection.findMany({
      where: {
        companyId: user.companyId,
        sellerId: scopedSellerId,
        OR: [{ date: { gte: todayStart, lt: todayEnd } }, { createdAt: { gte: todayStart, lt: todayEnd } }]
      }
    }),
    prisma.cashbox.findFirst({
      where: { companyId: user.companyId, sellerId: scopedSellerId, date: { gte: todayStart, lt: todayEnd } },
      orderBy: { openedAt: "desc" }
    }),
    prisma.expense.findMany({
      where: {
        companyId: user.companyId,
        sellerId: scopedSellerId,
        OR: [{ date: { gte: todayStart, lt: todayEnd } }, { createdAt: { gte: todayStart, lt: todayEnd } }]
      }
    })
  ]);

  const collectedToday = collections.reduce((sum, item) => sum + Number(item.amount), 0);
  const outgoingToday = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return mobileOk({
    company,
    sellerId: scopedSellerId,
    route,
    cashbox: cashbox ? {
      id: cashbox.id,
      status: cashbox.status,
      initialCash: Number(cashbox.initialCash),
      expectedCash: Number(cashbox.expectedCash),
      reportedCash: Number(cashbox.reportedCash),
      reportedTransfer: Number(cashbox.reportedTransfer),
      reportedPix: Number(cashbox.reportedPix),
      difference: Number(cashbox.difference),
      openedAt: cashbox.openedAt.toISOString(),
      closedAt: cashbox.closedAt?.toISOString() ?? null
    } : null,
    summary: {
      clients: clients.length,
      pending: clients.filter((client) => !client.collections.length).length,
      paid: clients.filter((client) => client.collections.length > 0).length,
      expectedToday: clients.reduce((sum, client) => sum + Number(client.loans[0]?.dailyPayment ?? 0), 0),
      collectedToday,
      outgoingToday
    },
    clients: clients.map((client) => {
      const loan = client.loans[0];
      const paidToday = client.collections.reduce((sum, item) => sum + Number(item.amount), 0);
      return {
        id: client.id,
        name: client.name,
        phone: client.phone,
        address: client.address,
        document: client.document,
        status: client.status,
        currencyCode: client.currencyCode,
        paidToday,
        loan: loan ? {
          id: loan.id,
          totalAmount: Number(loan.totalAmount),
          dailyPayment: Number(loan.dailyPayment),
          paidAmount: Number(loan.paidAmount),
          balance: Number(loan.balance),
          installmentsPaid: Number(loan.installmentsPaid),
          termDays: loan.termDays,
          dueDate: loan.dueDate.toISOString()
        } : null
      };
    })
  });
}
