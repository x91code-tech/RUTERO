import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { normalizeCashMovementKind } from "@/lib/cash-movements";
import { demoClients, demoCollections, demoCompany, demoExpenses, demoLoans, demoSales } from "@/lib/demo-data";
import type { Client, Collection, Company, Expense, Loan, Sale } from "@/lib/types";

export async function getFinancialPageData() {
  const user = await getSessionUser();
  if (!user) {
    return {
      company: demoCompany,
      clients: demoClients,
      loans: demoLoans,
      sales: demoSales,
      collections: demoCollections,
      expenses: demoExpenses
    };
  }

  const sellerScope = user.role === "SELLER" ? { sellerId: user.id } : {};
  const [company, clients, loans, sales, collections, expenses] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
    prisma.client.findMany({ where: { companyId: user.companyId, ...sellerScope }, orderBy: { name: "asc" } }),
    prisma.loan.findMany({ where: { companyId: user.companyId, ...sellerScope }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.sale.findMany({ where: { companyId: user.companyId, ...sellerScope }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.collection.findMany({ where: { companyId: user.companyId, ...sellerScope }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.expense.findMany({ where: { companyId: user.companyId, ...sellerScope }, orderBy: { createdAt: "desc" }, take: 25 })
  ]);

  return {
    company: {
      id: company.id,
      name: company.name,
      rif: company.rif ?? undefined,
      plan: "PRO",
      countryCode: company.countryCode,
      currencyCode: company.currencyCode,
      locale: company.locale,
      timeZone: company.timeZone
    } satisfies Company,
    clients: clients.map((client) => ({
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
      type: expense.type as Expense["type"],
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      date: expense.date.toISOString(),
      comment: expense.comment ?? ""
    })) satisfies Expense[]
  };
}
