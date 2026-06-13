import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { Cashbox, Client, Collection, Company, Expense, Loan, Route, Sale, User } from "@/lib/types";

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
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

export async function getReportsPageData() {
  const user = await getSessionUser();
  if (!user) return null;

  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const sellerScope = user.role === "SELLER" ? { sellerId: user.id } : {};
  const [company, users, routes, clients, loans, sales, collections, expenses, cashboxes] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
    prisma.user.findMany({ where: { companyId: user.companyId, active: true }, orderBy: { name: "asc" } }),
    prisma.route.findMany({ where: { companyId: user.companyId, ...(user.role === "SELLER" ? { sellerId: user.id } : {}) }, include: { routeClients: true }, orderBy: { name: "asc" } }),
    prisma.client.findMany({ where: { companyId: user.companyId, ...sellerScope }, include: { routeClients: true }, orderBy: { name: "asc" } }),
    prisma.loan.findMany({ where: { companyId: user.companyId, ...sellerScope, createdAt: { gte: todayStart, lt: todayEnd } }, orderBy: { createdAt: "desc" } }),
    prisma.sale.findMany({ where: { companyId: user.companyId, ...sellerScope, date: { gte: todayStart, lt: todayEnd } }, orderBy: { createdAt: "desc" } }),
    prisma.collection.findMany({ where: { companyId: user.companyId, ...sellerScope, date: { gte: todayStart, lt: todayEnd } }, orderBy: { createdAt: "desc" } }),
    prisma.expense.findMany({ where: { companyId: user.companyId, ...sellerScope, date: { gte: todayStart, lt: todayEnd } }, orderBy: { createdAt: "desc" } }),
    prisma.cashbox.findMany({ where: { companyId: user.companyId, ...(user.role === "SELLER" ? { sellerId: user.id } : {}), date: todayStart }, orderBy: { openedAt: "desc" } })
  ]);
  const activeSeller = users.find((item) => item.id === user.id) ?? users[0];
  const cashbox = cashboxes.find((item) => item.sellerId === activeSeller?.id) ?? cashboxes[0];

  return {
    company: toCompany(company),
    currentUser: {
      id: user.id,
      companyId: user.companyId,
      name: user.name,
      email: user.email,
      role: user.role
    } satisfies User,
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
      type: expense.type,
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      date: expense.date.toISOString(),
      comment: expense.comment ?? ""
    })) satisfies Expense[],
    cashbox: {
      id: cashbox?.id ?? "cashbox_report",
      companyId: user.companyId,
      sellerId: cashbox?.sellerId ?? activeSeller?.id ?? user.id,
      date: todayStart.toISOString(),
      initialCash: Number(cashbox?.initialCash ?? 0),
      reportedCash: Number(cashbox?.reportedCash ?? 0),
      reportedTransfer: Number(cashbox?.reportedTransfer ?? 0),
      reportedPix: Number(cashbox?.reportedPix ?? 0),
      status: cashbox?.status ?? "OPEN",
      observations: cashbox?.observations ?? ""
    } satisfies Cashbox
  };
}
