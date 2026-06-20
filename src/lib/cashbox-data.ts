import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { cashMovementKindLabels, getCashMovementImpact, normalizeCashMovementKind } from "@/lib/cash-movements";
import { demoCashbox, demoCollections, demoCompany, demoExpenses, demoLoans, demoSales } from "@/lib/demo-data";
import { endOfLocalDay, startOfLocalDay } from "@/lib/date-utils";
import type { Cashbox, Collection, Company, Expense, Loan, Role, Sale, User } from "@/lib/types";

export type CashboxMovementRow = {
  id: string;
  type: "Prestamo" | "Venta" | "Recaudo" | "Gasto" | "Retiro" | "Entrada";
  description: string;
  paymentMethod: string;
  date: string;
  amount: number;
};

function toCompany(company: {
  id: string;
  name: string;
  rif: string | null;
  countryCode: string;
  currencyCode: string;
  locale: string;
  timeZone: string;
}): Company {
  return {
    id: company.id,
    name: company.name,
    rif: company.rif ?? undefined,
    plan: "PRO",
    countryCode: company.countryCode,
    currencyCode: company.currencyCode,
    locale: company.locale,
    timeZone: company.timeZone
  };
}

export async function getCashboxPageData() {
  const user = await getSessionUser();
  if (!user) {
    return {
      company: demoCompany,
      cashbox: demoCashbox,
      loans: demoLoans,
      sales: demoSales,
      collections: demoCollections,
      expenses: demoExpenses,
      currentUser: null,
      openedCashboxes: 1,
      collectorCount: 1,
      canOpenCashboxes: false,
      movements: [
        ...demoLoans.map((loan) => ({
          id: loan.id,
          type: "Prestamo" as const,
          description: "Prestamo entregado",
          paymentMethod: "CASH_LOCAL",
          date: loan.startDate,
          amount: -loan.principalAmount
        })),
        ...demoSales.map((sale) => ({
          id: sale.id,
          type: "Venta" as const,
          description: sale.product,
          paymentMethod: sale.paymentMethod,
          date: sale.date,
          amount: sale.amount
        })),
        ...demoCollections.map((collection) => ({
          id: collection.id,
          type: "Recaudo" as const,
          description: "Pago de cliente",
          paymentMethod: collection.paymentMethod,
          date: collection.date,
          amount: collection.amount
        })),
        ...demoExpenses.map((expense) => ({
          id: expense.id,
          type: cashMovementKindLabels[expense.movementKind],
          description: expense.comment || expense.type,
          paymentMethod: expense.paymentMethod,
          date: expense.date,
          amount: getCashMovementImpact(expense.amount, expense.movementKind)
        }))
      ] satisfies CashboxMovementRow[]
    };
  }

  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const sellerScope = user.role === "SELLER" ? { sellerId: user.id } : {};
  const movementDateScope = { OR: [{ date: { gte: todayStart, lt: todayEnd } }, { createdAt: { gte: todayStart, lt: todayEnd } }] };
  const [company, cashboxes, loans, sales, collections, expenses, collectors] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
    prisma.cashbox.findMany({
      where: { companyId: user.companyId, ...sellerScope, date: { gte: todayStart, lt: todayEnd } }
    }),
    prisma.loan.findMany({ where: { companyId: user.companyId, ...sellerScope, createdAt: { gte: todayStart, lt: todayEnd } }, include: { client: { select: { name: true } } } }),
    prisma.sale.findMany({ where: { companyId: user.companyId, ...sellerScope, ...movementDateScope }, include: { client: { select: { name: true } } } }),
    prisma.collection.findMany({ where: { companyId: user.companyId, ...sellerScope, ...movementDateScope }, include: { client: { select: { name: true } } } }),
    prisma.expense.findMany({ where: { companyId: user.companyId, ...sellerScope, ...movementDateScope } }),
    prisma.user.findMany({
      where: {
        companyId: user.companyId,
        active: true,
        role: "SELLER",
        ...(user.role === "SELLER" ? { id: user.id } : {})
      },
      select: { id: true, companyId: true, name: true, email: true, role: true, mobileIdentifier: true }
    })
  ]);
  const collectorIds = collectors.map((collector) => collector.id);
  const previousCashboxes = collectorIds.length
    ? await prisma.cashbox.findMany({
        where: {
          companyId: user.companyId,
          sellerId: { in: collectorIds },
          date: { lt: todayStart },
          closedAt: { not: null }
        },
        orderBy: { date: "desc" }
      })
    : [];
  const previousBySeller = new Map<string, (typeof previousCashboxes)[number]>();
  for (const previous of previousCashboxes) {
    if (!previousBySeller.has(previous.sellerId)) previousBySeller.set(previous.sellerId, previous);
  }
  const openedSellerIds = new Set(cashboxes.map((cashbox) => cashbox.sellerId));
  const carryForwardInitialCash = collectorIds
    .filter((sellerId) => !openedSellerIds.has(sellerId))
    .reduce((total, sellerId) => total + Number(previousBySeller.get(sellerId)?.reportedCash ?? 0), 0);
  const currentCashbox = cashboxes.find((item) => item.sellerId === user.id) ?? cashboxes[0];
  const sumCashboxes = (selector: (cashbox: (typeof cashboxes)[number]) => unknown) =>
    cashboxes.reduce((total, item) => total + Number(selector(item) ?? 0), 0);

  return {
    company: toCompany(company),
    cashbox: {
      id: currentCashbox?.id ?? "cashbox_today",
      companyId: user.companyId,
      sellerId: user.id,
      date: todayStart.toISOString(),
      initialCash: sumCashboxes((cashbox) => cashbox.initialCash) + carryForwardInitialCash,
      reportedCash: sumCashboxes((cashbox) => cashbox.reportedCash),
      reportedTransfer: sumCashboxes((cashbox) => cashbox.reportedTransfer),
      reportedPix: sumCashboxes((cashbox) => cashbox.reportedPix),
      status: cashboxes.some((cashbox) => cashbox.status === "OPEN") ? "OPEN" : currentCashbox?.status ?? "OPEN",
      observations: cashboxes.map((cashbox) => cashbox.observations).filter(Boolean).join(" | ")
    } satisfies Cashbox,
    currentUser: {
      id: user.id,
      companyId: user.companyId,
      name: user.name,
      email: user.email,
      mobileIdentifier: user.mobileIdentifier ?? undefined,
      role: user.role as Role
    } satisfies User,
    openedCashboxes: cashboxes.length,
    collectorCount: collectors.length,
    canOpenCashboxes: user.role !== "SELLER",
    loans: loans.map((loan) => ({
      id: loan.id,
      companyId: loan.companyId,
      clientId: loan.clientId,
      sellerId: loan.sellerId,
      principalAmount: Number(loan.principalAmount),
      interestRate: Number(loan.interestRate),
      interestAmount: Number(loan.interestAmount),
      totalAmount: Number(loan.totalAmount),
      dailyPayment: Number(loan.dailyPayment),
      paidAmount: Number(loan.paidAmount),
      balance: Number(loan.balance),
      principalBalance: Number(loan.principalBalance),
      interestBalance: Number(loan.interestBalance),
      lateFeeBalance: Number(loan.lateFeeBalance),
      installmentsPaid: Number(loan.installmentsPaid),
      paymentFrequency: loan.paymentFrequency,
      termDays: loan.termDays,
      startDate: loan.startDate.toISOString(),
      dueDate: loan.dueDate.toISOString(),
      status: loan.status,
      notes: loan.notes ?? undefined
    })) satisfies Loan[],
    sales: sales.map((sale) => ({
      id: sale.id,
      companyId: sale.companyId,
      clientId: sale.clientId,
      sellerId: sale.sellerId,
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
      amount: Number(collection.amount),
      paymentType: collection.paymentType,
      application: collection.application,
      balanceApplied: Number(collection.balanceApplied),
      principalApplied: Number(collection.principalApplied),
      interestApplied: Number(collection.interestApplied),
      lateFeeApplied: Number(collection.lateFeeApplied),
      additionalApplied: Number(collection.additionalApplied),
      overpaymentAmount: Number(collection.overpaymentAmount),
      installmentsCovered: Number(collection.installmentsCovered),
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
      movementKind: normalizeCashMovementKind(expense.movementKind),
      type: expense.type as Expense["type"],
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      date: expense.date.toISOString(),
      comment: expense.comment ?? ""
    })) satisfies Expense[],
    movements: [
      ...loans.map((loan) => ({
        id: loan.id,
        type: "Prestamo" as const,
        description: loan.client.name,
        paymentMethod: "CASH_LOCAL",
        date: loan.createdAt.toISOString(),
        amount: -Number(loan.principalAmount)
      })),
      ...sales.map((sale) => ({
        id: sale.id,
        type: "Venta" as const,
        description: `${sale.client.name} - ${sale.concept}`,
        paymentMethod: sale.paymentMethod,
        date: sale.date.toISOString(),
        amount: Number(sale.amount)
      })),
      ...collections.map((collection) => ({
        id: collection.id,
        type: "Recaudo" as const,
        description: collection.client.name,
        paymentMethod: collection.paymentMethod,
        date: collection.date.toISOString(),
        amount: Number(collection.amount)
      })),
      ...expenses.map((expense) => ({
        id: expense.id,
        type: cashMovementKindLabels[normalizeCashMovementKind(expense.movementKind)],
        description: expense.comment ? `${expense.type} - ${expense.comment}` : expense.type,
        paymentMethod: expense.paymentMethod,
        date: expense.date.toISOString(),
        amount: getCashMovementImpact(Number(expense.amount), normalizeCashMovementKind(expense.movementKind))
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) satisfies CashboxMovementRow[]
  };
}
