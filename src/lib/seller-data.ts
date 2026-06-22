import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { demoClients, demoCollections, demoCompany, demoLoans } from "@/lib/demo-data";
import { endOfLocalDay, startOfLocalDay } from "@/lib/date-utils";
import { getInstallmentNumber, shouldCollectOnDate } from "@/lib/loan-schedule";
import type { Client, Collection, Company, Loan } from "@/lib/types";

export type SellerCollectionItem = {
  client: Client;
  loan: Loan;
  paidToday: number;
  receivedToday: number;
  installmentNumber: number;
  expectedPaidToDate: number;
  lateAmount: number;
  isPaidToday: boolean;
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
  disbursedAmount?: unknown;
  interestRate: unknown;
  interestAmount: unknown;
  totalAmount: unknown;
  dailyPayment: unknown;
  paidAmount: unknown;
  balance: unknown;
  principalBalance: unknown;
  interestBalance: unknown;
  lateFeeBalance: unknown;
  installmentsPaid: unknown;
  paymentFrequency: Loan["paymentFrequency"];
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
    disbursedAmount: Number(loan.disbursedAmount ?? loan.principalAmount),
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
  };
}

function toCollection(collection: {
  id: string;
  companyId: string;
  clientId: string;
  loanId: string | null;
  sellerId: string;
  amount: unknown;
  paymentType: Collection["paymentType"];
  application: Collection["application"];
  balanceApplied: unknown;
  principalApplied: unknown;
  interestApplied: unknown;
  lateFeeApplied: unknown;
  additionalApplied: unknown;
  overpaymentAmount: unknown;
  installmentsCovered: unknown;
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
  };
}

function buildItems(clients: Client[], loans: Loan[], collections: Collection[], search = "", statusFilter = "todos", targetDate: Date | string = new Date()) {
  const normalizedSearch = search.trim().toLowerCase();

  return loans
    .filter((loan) => loan.status === "ACTIVE" && loan.balance > 0)
    .map((loan) => {
      const client = clients.find((item) => item.id === loan.clientId);
      if (!client) return null;

      const todayCollections = collections.filter((collection) => collection.loanId === loan.id);
      const receivedToday = todayCollections.reduce((total, collection) => total + collection.amount, 0);
      const paidToday = todayCollections.reduce((total, collection) => total + (collection.balanceApplied ?? collection.amount), 0);
      const shouldCollectToday = shouldCollectOnDate({ startDate: loan.startDate, targetDate, frequency: loan.paymentFrequency });
      if (!shouldCollectToday) return null;

      const installmentNumber = getInstallmentNumber({
        startDate: loan.startDate,
        targetDate,
        frequency: loan.paymentFrequency,
        termDays: loan.termDays
      });
      const expectedPaidToDate = Math.min(installmentNumber * loan.dailyPayment, loan.totalAmount);
      const lateAmount = Math.max(expectedPaidToDate - loan.paidAmount, 0);
      const expectedToday = Math.min(loan.dailyPayment, loan.balance);

      return {
        client,
        loan,
        paidToday,
        receivedToday,
        installmentNumber,
        expectedPaidToDate,
        lateAmount,
        isPaidToday: expectedToday === 0 || paidToday >= expectedToday
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
    .filter((item) => {
      if (statusFilter === "pendientes") return !item.isPaidToday;
      if (statusFilter === "pagados") return item.isPaidToday;
      if (statusFilter === "atrasados") return item.lateAmount > 0;
      return true;
    })
    .sort((a, b) => {
      if (a.isPaidToday !== b.isPaidToday) return a.isPaidToday ? 1 : -1;
      return b.lateAmount - a.lateAmount;
    });
}

export async function getSellerDailyCollectionData(search = "", statusFilter = "todos") {
  const user = await getSessionUser();

  if (!user) {
    const collectionsToday = demoCollections.filter((collection) => collection.date === "2026-06-12");
    const targetDate = new Date("2026-06-12T00:00:00");
    const allItems = buildItems(demoClients, demoLoans, collectionsToday, search, "todos", targetDate);
    const items = statusFilter === "todos" ? allItems : buildItems(demoClients, demoLoans, collectionsToday, search, statusFilter, targetDate);

    return {
      company: demoCompany,
      canCollect: true,
      cashboxStatus: "OPEN",
      items,
      totals: {
        pendingClients: allItems.filter((item) => !item.isPaidToday).length,
        paidClients: allItems.filter((item) => item.isPaidToday).length,
        expectedToday: allItems.reduce((total, item) => total + Math.min(item.loan.dailyPayment, item.loan.balance), 0),
        collectedToday: allItems.reduce((total, item) => total + item.receivedToday, 0),
        activeBalance: allItems.reduce((total, item) => total + item.loan.balance, 0)
      }
    };
  }

  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const [company, clients, loans, collections, cashbox] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
    prisma.client.findMany({ where: { companyId: user.companyId, sellerId: user.id }, orderBy: { name: "asc" } }),
    prisma.loan.findMany({ where: { companyId: user.companyId, sellerId: user.id, status: "ACTIVE" }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }),
    prisma.collection.findMany({
      where: {
        companyId: user.companyId,
        sellerId: user.id,
        OR: [{ date: { gte: todayStart, lt: todayEnd } }, { createdAt: { gte: todayStart, lt: todayEnd } }]
      }
    }),
    prisma.cashbox.findFirst({
      where: {
        companyId: user.companyId,
        sellerId: user.id,
        date: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      select: { status: true }
    })
  ]);
  const mappedClients = clients.map(toClient);
  const mappedLoans = loans.map(toLoan);
  const mappedCollections = collections.map(toCollection);
  const allItems = buildItems(mappedClients, mappedLoans, mappedCollections, search, "todos", todayStart);
  const items = statusFilter === "todos" ? allItems : buildItems(mappedClients, mappedLoans, mappedCollections, search, statusFilter, todayStart);

  return {
    company: toCompany(company),
    canCollect: cashbox?.status === "OPEN",
    cashboxStatus: cashbox?.status ?? "NOT_OPEN",
    items,
    totals: {
      pendingClients: allItems.filter((item) => !item.isPaidToday).length,
      paidClients: allItems.filter((item) => item.isPaidToday).length,
      expectedToday: allItems.reduce((total, item) => total + Math.min(item.loan.dailyPayment, item.loan.balance), 0),
      collectedToday: allItems.reduce((total, item) => total + item.receivedToday, 0),
      activeBalance: allItems.reduce((total, item) => total + item.loan.balance, 0)
    }
  };
}
