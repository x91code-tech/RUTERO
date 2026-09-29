import { NextResponse } from "next/server";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { normalizeCashMovementKind } from "@/lib/cash-movements";
import { getCurrencyConfig } from "@/lib/countries";
import { endOfLocalDay, startOfLocalDay } from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import { mobileError, mobileOk, requireMobileUser } from "@/lib/mobile-api";
import type { Cashbox, Collection, Expense, Sale } from "@/lib/types";
import { cashboxCloseSchema } from "@/lib/validations";
import { createNotification } from "@/server/services/notification-service";

export const dynamic = "force-dynamic";

async function readJson(request: Request) {
  return request.headers.get("content-type")?.includes("application/json")
    ? await request.json()
    : Object.fromEntries(await request.formData());
}

export async function POST(request: Request) {
  const user = await requireMobileUser(request);
  if (user instanceof NextResponse) return user;
  if (user.role !== "SELLER") return mobileError("Solo el cobrador puede cerrar su caja desde la app movil.", 403);

  const parsed = cashboxCloseSchema.safeParse(await readJson(request));
  if (!parsed.success) return mobileError("Revisa los montos de cierre.", 422);
  const payload = parsed.data;

  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const sellerScope = { sellerId: user.id };
  const movementDateScope = { OR: [{ date: { gte: todayStart, lt: todayEnd } }, { createdAt: { gte: todayStart, lt: todayEnd } }] };
  const [sales, collections, expenses, loans, todayCashbox, previousCashbox] = await Promise.all([
    prisma.sale.findMany({ where: { companyId: user.companyId, ...sellerScope, ...movementDateScope } }),
    prisma.collection.findMany({ where: { companyId: user.companyId, ...sellerScope, ...movementDateScope } }),
    prisma.expense.findMany({ where: { companyId: user.companyId, ...sellerScope, ...movementDateScope } }),
    prisma.loan.findMany({ where: { companyId: user.companyId, ...sellerScope, createdAt: { gte: todayStart, lt: todayEnd } } }),
    prisma.cashbox.findUnique({ where: { sellerId_date: { sellerId: user.id, date: todayStart } } }),
    prisma.cashbox.findFirst({
      where: { companyId: user.companyId, sellerId: user.id, date: { lt: todayStart }, closedAt: { not: null } },
      orderBy: { date: "desc" }
    })
  ]);

  if (!todayCashbox || todayCashbox.status !== "OPEN") return mobileError("La caja de hoy no esta abierta.", 409);

  const currency = getCurrencyConfig({ countryCode: user.countryCode });
  const fixedInitialCash = Number(todayCashbox.initialCash ?? previousCashbox?.reportedCash ?? 0);
  const cashboxInput: Cashbox = {
    id: todayCashbox.id,
    companyId: user.companyId,
    sellerId: user.id,
    countryCode: user.countryCode,
    currencyCode: currency.currencyCode,
    date: todayStart.toISOString(),
    initialCash: fixedInitialCash,
    reportedCash: payload.reportedCash,
    reportedTransfer: payload.reportedTransfer,
    reportedPix: payload.reportedPix,
    status: "OPEN",
    observations: payload.observations ?? ""
  };
  const summary = calculateDailySummary({
    cashbox: cashboxInput,
    countryCode: user.countryCode,
    sales: sales.map((sale) => ({
      id: sale.id,
      companyId: sale.companyId,
      clientId: sale.clientId,
      sellerId: sale.sellerId,
      countryCode: sale.countryCode,
      currencyCode: sale.currencyCode,
      product: sale.concept,
      amount: Number(sale.amount),
      paymentMethod: sale.paymentMethod,
      date: sale.date.toISOString(),
      observation: sale.observation ?? undefined
    })) satisfies Sale[],
    collections: collections.map((collection) => ({
      id: collection.id,
      companyId: collection.companyId,
      clientId: collection.clientId,
      loanId: collection.loanId ?? undefined,
      sellerId: collection.sellerId,
      countryCode: collection.countryCode,
      currencyCode: collection.currencyCode,
      amount: Number(collection.amount),
      previousBalance: Number(collection.previousBalance),
      newBalance: Number(collection.newBalance),
      paymentMethod: collection.paymentMethod,
      date: collection.date.toISOString(),
      observation: collection.observation ?? undefined
    })) satisfies Collection[],
    expenses: expenses.map((expense) => ({
      id: expense.id,
      companyId: expense.companyId,
      sellerId: expense.sellerId,
      countryCode: expense.countryCode,
      currencyCode: expense.currencyCode,
      movementKind: normalizeCashMovementKind(expense.movementKind),
      type: expense.type as Expense["type"],
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      date: expense.date.toISOString(),
      comment: expense.comment ?? ""
    })) satisfies Expense[],
    loans: loans.map((loan) => ({
      id: loan.id,
      companyId: loan.companyId,
      clientId: loan.clientId,
      sellerId: loan.sellerId,
      countryCode: loan.countryCode,
      currencyCode: loan.currencyCode,
      principalAmount: Number(loan.principalAmount),
      disbursedAmount: Number(loan.disbursedAmount ?? loan.principalAmount),
      interestRate: Number(loan.interestRate),
      interestAmount: Number(loan.interestAmount),
      totalAmount: Number(loan.totalAmount),
      dailyPayment: Number(loan.dailyPayment),
      paidAmount: Number(loan.paidAmount),
      balance: Number(loan.balance),
      paymentFrequency: loan.paymentFrequency,
      termDays: loan.termDays,
      startDate: loan.startDate.toISOString(),
      dueDate: loan.dueDate.toISOString(),
      status: loan.status,
      notes: loan.notes ?? undefined
    }))
  });

  const status = summary.difference === 0 ? "BALANCED" : "UNBALANCED";
  const cashbox = await prisma.cashbox.update({
    where: { id: todayCashbox.id },
    data: {
      reportedCash: payload.reportedCash,
      reportedTransfer: payload.reportedTransfer,
      reportedPix: payload.reportedPix,
      expectedCash: summary.expectedCash,
      difference: summary.difference,
      status,
      observations: payload.observations,
      closedAt: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      action: "MOBILE_CASHBOX_CLOSED",
      entity: "Cashbox",
      entityId: cashbox.id,
      newValue: { ...payload, initialCash: fixedInitialCash, expectedCash: summary.expectedCash, difference: summary.difference, status }
    }
  });

  await createNotification({
    companyId: user.companyId,
    title: summary.difference === 0 ? "Caja cerrada correctamente" : "Caja con diferencia",
    message: summary.difference === 0
      ? `${user.name} cerro caja sin diferencias.`
      : `${user.name} cerro caja con diferencia de ${summary.difference}.`,
    severity: summary.difference === 0 ? "info" : "critical"
  });

  return mobileOk({
    cashbox: {
      id: cashbox.id,
      status: cashbox.status,
      initialCash: Number(cashbox.initialCash),
      expectedCash: Number(cashbox.expectedCash),
      reportedCash: Number(cashbox.reportedCash),
      reportedTransfer: Number(cashbox.reportedTransfer),
      reportedPix: Number(cashbox.reportedPix),
      difference: Number(cashbox.difference),
      closedAt: cashbox.closedAt?.toISOString() ?? null
    }
  });
}
