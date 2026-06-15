import type { CashboxStatus, PaymentMethod as PrismaPaymentMethod, Prisma } from "@prisma/client";
import { normalizeCashMovementKind } from "@/lib/cash-movements";
import { prisma } from "@/lib/db";
import { endOfLocalDay, formatDateInput, startOfLocalDay } from "@/lib/date-utils";
import { getSessionUser } from "@/lib/session";
import type { Cashbox, Client, Collection, Company, Expense, Loan, Route, Sale, User } from "@/lib/types";

export type ReportFilters = {
  from?: string;
  to?: string;
  sellerId?: string;
  routeId?: string;
  clientId?: string;
  paymentMethod?: string;
};

type ClientIdWhere = {
  clientId?: string | { in: string[] };
};

function parseDateInput(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function selected(value?: string) {
  return value && value !== "all" ? value : undefined;
}

function normalizeFilters(filters: ReportFilters = {}) {
  const today = startOfLocalDay();
  const fromDate = parseDateInput(filters.from) ?? today;
  const parsedToDate = parseDateInput(filters.to) ?? fromDate;
  const toDate = parsedToDate < fromDate ? fromDate : parsedToDate;

  return {
    fromDate,
    toDate,
    toDateExclusive: endOfLocalDay(toDate),
    values: {
      from: formatDateInput(fromDate),
      to: formatDateInput(toDate),
      sellerId: selected(filters.sellerId),
      routeId: selected(filters.routeId),
      clientId: selected(filters.clientId),
      paymentMethod: selected(filters.paymentMethod)
    }
  };
}

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

export async function getReportsPageData(filters: ReportFilters = {}) {
  const user = await getSessionUser();
  if (!user) return null;

  const normalized = normalizeFilters(filters);
  const activeSellerId = user.role === "SELLER" ? user.id : normalized.values.sellerId;
  const dateRange: Prisma.DateTimeFilter = {
    gte: normalized.fromDate,
    lt: normalized.toDateExclusive
  };
  const movementDateScope = { OR: [{ date: dateRange }, { createdAt: dateRange }] };
  const sellerWhere = activeSellerId ? { sellerId: activeSellerId } : {};

  const [company, users, routes, clients] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
    prisma.user.findMany({
      where: { companyId: user.companyId, active: true, ...(user.role === "SELLER" ? { id: user.id } : {}) },
      orderBy: { name: "asc" }
    }),
    prisma.route.findMany({
      where: { companyId: user.companyId, ...(activeSellerId ? { sellerId: activeSellerId } : {}) },
      include: { routeClients: true },
      orderBy: { name: "asc" }
    }),
    prisma.client.findMany({
      where: { companyId: user.companyId, ...(activeSellerId ? { sellerId: activeSellerId } : {}) },
      include: { routeClients: true },
      orderBy: { name: "asc" }
    })
  ]);

  const selectedRouteClientIds = normalized.values.routeId
    ? routes.find((route) => route.id === normalized.values.routeId)?.routeClients.map((routeClient) => routeClient.clientId) ?? []
    : undefined;
  const noClientMatch = "__no_client_match__";
  const clientWhere: ClientIdWhere =
    normalized.values.clientId && selectedRouteClientIds && !selectedRouteClientIds.includes(normalized.values.clientId)
      ? { clientId: noClientMatch }
      : normalized.values.clientId
        ? { clientId: normalized.values.clientId }
        : selectedRouteClientIds
          ? { clientId: { in: selectedRouteClientIds.length > 0 ? selectedRouteClientIds : [noClientMatch] } }
          : {};
  const paymentMethodWhere = normalized.values.paymentMethod
    ? { paymentMethod: normalized.values.paymentMethod as PrismaPaymentMethod }
    : {};

  const [loans, sales, collections, expenses, cashboxes] = await Promise.all([
    prisma.loan.findMany({
      where: {
        companyId: user.companyId,
        ...sellerWhere,
        ...clientWhere,
        createdAt: dateRange
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.sale.findMany({
      where: {
        companyId: user.companyId,
        ...sellerWhere,
        ...clientWhere,
        ...paymentMethodWhere,
        ...movementDateScope
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.collection.findMany({
      where: {
        companyId: user.companyId,
        ...sellerWhere,
        ...clientWhere,
        ...paymentMethodWhere,
        ...movementDateScope
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.expense.findMany({
      where: {
        companyId: user.companyId,
        ...sellerWhere,
        ...paymentMethodWhere,
        ...movementDateScope
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.cashbox.findMany({
      where: {
        companyId: user.companyId,
        ...sellerWhere,
        date: dateRange
      },
      orderBy: { openedAt: "desc" }
    })
  ]);

  const activeSeller = users.find((item) => item.id === activeSellerId) ?? users.find((item) => item.id === user.id) ?? users[0];
  const cashbox = buildReportCashbox({
    cashboxes,
    companyId: user.companyId,
    sellerId: activeSeller?.id ?? user.id,
    date: normalized.fromDate
  });

  return {
    company: toCompany(company),
    currentUser: {
      id: user.id,
      companyId: user.companyId,
      name: user.name,
      email: user.email,
      role: user.role
    } satisfies User,
    filters: normalized.values,
    users: users.map((item) => ({
      id: item.id,
      companyId: item.companyId,
      name: item.name,
      email: item.email,
      role: item.role
    })) satisfies User[],
    routes: routes.map((route) => ({
      id: route.id,
      companyId: route.companyId,
      name: route.name,
      zone: route.zone,
      sellerId: route.sellerId ?? "",
      clientIds: route.routeClients.map((routeClient) => routeClient.clientId)
    })) satisfies Route[],
    clients: clients.map((client) => ({
      id: client.id,
      companyId: client.companyId,
      name: client.name,
      phone: client.phone ?? "",
      address: client.address,
      latitude: client.latitude ? Number(client.latitude) : undefined,
      longitude: client.longitude ? Number(client.longitude) : undefined,
      document: client.document ?? "",
      routeId: client.routeClients[0]?.routeId ?? "",
      sellerId: client.sellerId,
      pendingBalance: Number(client.pendingBalance),
      status: client.status,
      notes: client.notes ?? ""
    })) satisfies Client[],
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
      type: expense.type,
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      date: expense.date.toISOString(),
      comment: expense.comment ?? ""
    })) satisfies Expense[],
    cashbox
  };
}

function buildReportCashbox(input: {
  cashboxes: {
    id: string;
    companyId: string;
    sellerId: string;
    date: Date;
    initialCash: Prisma.Decimal;
    reportedCash: Prisma.Decimal;
    reportedTransfer: Prisma.Decimal;
    reportedPix: Prisma.Decimal;
    status: CashboxStatus;
    observations: string | null;
  }[];
  companyId: string;
  sellerId: string;
  date: Date;
}): Cashbox {
  const { cashboxes } = input;
  const firstCashbox = cashboxes[0];

  return {
    id: firstCashbox?.id ?? "cashbox_report",
    companyId: input.companyId,
    sellerId: firstCashbox?.sellerId ?? input.sellerId,
    date: input.date.toISOString(),
    initialCash: sum(cashboxes.map((cashbox) => Number(cashbox.initialCash))),
    reportedCash: sum(cashboxes.map((cashbox) => Number(cashbox.reportedCash))),
    reportedTransfer: sum(cashboxes.map((cashbox) => Number(cashbox.reportedTransfer))),
    reportedPix: sum(cashboxes.map((cashbox) => Number(cashbox.reportedPix))),
    status: cashboxes.some((cashbox) => cashbox.status === "OPEN") ? "OPEN" : firstCashbox?.status ?? "OPEN",
    observations: cashboxes.map((cashbox) => cashbox.observations).filter(Boolean).join(" | ")
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
