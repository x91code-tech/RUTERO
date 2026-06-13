import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { demoCashbox, demoCollections, demoCompany, demoExpenses, demoLoans, demoSales } from "@/lib/demo-data";
import type { Cashbox, Collection, Company, Expense, Loan, Sale } from "@/lib/types";

export type CashboxMovementRow = {
  id: string;
  type: "Prestamo" | "Venta" | "Recaudo" | "Gasto";
  description: string;
  paymentMethod: string;
  date: string;
  amount: number;
};

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
          type: "Gasto" as const,
          description: expense.comment || expense.type,
          paymentMethod: expense.paymentMethod,
          date: expense.date,
          amount: -expense.amount
        }))
      ] satisfies CashboxMovementRow[]
    };
  }

  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const [company, cashbox, loans, sales, collections, expenses] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
    prisma.cashbox.findUnique({
      where: {
        sellerId_date: {
          sellerId: user.id,
          date: todayStart
        }
      }
    }),
    prisma.loan.findMany({ where: { companyId: user.companyId, sellerId: user.id, createdAt: { gte: todayStart, lt: todayEnd } }, include: { client: { select: { name: true } } } }),
    prisma.sale.findMany({ where: { companyId: user.companyId, sellerId: user.id, date: { gte: todayStart, lt: todayEnd } }, include: { client: { select: { name: true } } } }),
    prisma.collection.findMany({ where: { companyId: user.companyId, sellerId: user.id, date: { gte: todayStart, lt: todayEnd } }, include: { client: { select: { name: true } } } }),
    prisma.expense.findMany({ where: { companyId: user.companyId, sellerId: user.id, date: { gte: todayStart, lt: todayEnd } } })
  ]);

  return {
    company: toCompany(company),
    cashbox: {
      id: cashbox?.id ?? "cashbox_today",
      companyId: user.companyId,
      sellerId: user.id,
      date: todayStart.toISOString(),
      initialCash: Number(cashbox?.initialCash ?? 0),
      reportedCash: Number(cashbox?.reportedCash ?? 0),
      reportedTransfer: Number(cashbox?.reportedTransfer ?? 0),
      reportedPix: Number(cashbox?.reportedPix ?? 0),
      status: cashbox?.status ?? "OPEN",
      observations: cashbox?.observations ?? ""
    } satisfies Cashbox,
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
        type: "Gasto" as const,
        description: expense.comment ? `${expense.type} - ${expense.comment}` : expense.type,
        paymentMethod: expense.paymentMethod,
        date: expense.date.toISOString(),
        amount: -Number(expense.amount)
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) satisfies CashboxMovementRow[]
  };
}
