import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { demoClients, demoCollections, demoCompany, demoLoans } from "@/lib/demo-data";
import type { Client, Collection, Company, Loan } from "@/lib/types";

export type SellerCollectionItem = {
  client: Client;
  loan: Loan;
  paidToday: number;
  installmentNumber: number;
  expectedPaidToDate: number;
  lateAmount: number;
  isPaidToday: boolean;
};

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function daysBetween(startDate: string | Date, endDate = new Date()) {
  const start = startOfLocalDay(new Date(startDate));
  const end = startOfLocalDay(endDate);
  return Math.max(Math.floor((end.getTime() - start.getTime()) / 86400000) + 1, 1);
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

function toClient(client: {
  id: string;
  companyId: string;
  sellerId: string;
  name: string;
  phone: string | null;
  address: string;
  latitude: unknown;
  longitude: unknown;
  document: string | null;
  pendingBalance: unknown;
  status: Client["status"];
  notes: string | null;
}): Client {
  return {
    id: client.id,
    companyId: client.companyId,
    name: client.name,
    phone: client.phone ?? "",
    address: client.address,
    latitude: client.latitude ? Number(client.latitude) : undefined,
    longitude: client.longitude ? Number(client.longitude) : undefined,
    document: client.document ?? "",
    routeId: "",
    sellerId: client.sellerId,
    pendingBalance: Number(client.pendingBalance),
    status: client.status,
    notes: client.notes ?? ""
  };
}

function toLoan(loan: {
  id: string;
  companyId: string;
  clientId: string;
  sellerId: string;
  principalAmount: unknown;
  interestRate: unknown;
  interestAmount: unknown;
  totalAmount: unknown;
  dailyPayment: unknown;
  paidAmount: unknown;
  balance: unknown;
  termDays: number;
  startDate: Date;
  dueDate: Date;
  status: Loan["status"];
  notes: string | null;
}): Loan {
  return {
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
  };
}

function toCollection(collection: {
  id: string;
  companyId: string;
  clientId: string;
  loanId: string | null;
  sellerId: string;
  amount: unknown;
  previousBalance: unknown;
  newBalance: unknown;
  paymentMethod: Collection["paymentMethod"];
  date: Date;
  observation: string | null;
}): Collection {
  return {
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
  };
}

function buildItems(clients: Client[], loans: Loan[], collections: Collection[], search = "") {
  const normalizedSearch = search.trim().toLowerCase();

  return loans
    .filter((loan) => loan.status === "ACTIVE" && loan.balance > 0)
    .map((loan) => {
      const client = clients.find((item) => item.id === loan.clientId);
      if (!client) return null;

      const todayCollections = collections.filter((collection) => collection.loanId === loan.id);
      const paidToday = todayCollections.reduce((total, collection) => total + collection.amount, 0);
      const installmentNumber = Math.min(daysBetween(loan.startDate), loan.termDays);
      const expectedPaidToDate = Math.min(installmentNumber * loan.dailyPayment, loan.totalAmount);
      const lateAmount = Math.max(expectedPaidToDate - loan.paidAmount, 0);

      return {
        client,
        loan,
        paidToday,
        installmentNumber,
        expectedPaidToDate,
        lateAmount,
        isPaidToday: paidToday >= Math.min(loan.dailyPayment, loan.balance)
      } satisfies SellerCollectionItem;
    })
    .filter((item): item is SellerCollectionItem => Boolean(item))
    .filter((item) => {
      if (!normalizedSearch) return true;
      return [item.client.name, item.client.document, item.client.phone, item.client.address]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (a.isPaidToday !== b.isPaidToday) return a.isPaidToday ? 1 : -1;
      return b.lateAmount - a.lateAmount;
    });
}

export async function getSellerDailyCollectionData(search = "") {
  const user = await getSessionUser();

  if (!user) {
    const collectionsToday = demoCollections.filter((collection) => collection.date === "2026-06-12");
    const items = buildItems(demoClients, demoLoans, collectionsToday, search);

    return {
      company: demoCompany,
      items,
      totals: {
        pendingClients: items.filter((item) => !item.isPaidToday).length,
        paidClients: items.filter((item) => item.isPaidToday).length,
        expectedToday: items.reduce((total, item) => total + Math.min(item.loan.dailyPayment, item.loan.balance), 0),
        collectedToday: items.reduce((total, item) => total + item.paidToday, 0),
        activeBalance: items.reduce((total, item) => total + item.loan.balance, 0)
      }
    };
  }

  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const [company, clients, loans, collections] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
    prisma.client.findMany({ where: { companyId: user.companyId, sellerId: user.id }, orderBy: { name: "asc" } }),
    prisma.loan.findMany({ where: { companyId: user.companyId, sellerId: user.id, status: "ACTIVE" }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }),
    prisma.collection.findMany({
      where: {
        companyId: user.companyId,
        sellerId: user.id,
        date: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    })
  ]);
  const items = buildItems(clients.map(toClient), loans.map(toLoan), collections.map(toCollection), search);

  return {
    company: toCompany(company),
    items,
    totals: {
      pendingClients: items.filter((item) => !item.isPaidToday).length,
      paidClients: items.filter((item) => item.isPaidToday).length,
      expectedToday: items.reduce((total, item) => total + Math.min(item.loan.dailyPayment, item.loan.balance), 0),
      collectedToday: items.reduce((total, item) => total + item.paidToday, 0),
      activeBalance: items.reduce((total, item) => total + item.loan.balance, 0)
    }
  };
}
