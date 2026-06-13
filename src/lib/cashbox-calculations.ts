import type { Cashbox, Collection, Expense, Loan, Sale } from "@/lib/types";
import { getPaymentMethodCategory } from "@/lib/payment-methods";

export type DailySummary = {
  salesTotal: number;
  collectionsTotal: number;
  expensesTotal: number;
  cashSales: number;
  cashCollections: number;
  cashExpenses: number;
  loanDisbursementsTotal: number;
  transferTotal: number;
  pixTotal: number;
  digitalTotal: number;
  grossMovement: number;
  netMovement: number;
  expectedCash: number;
  reportedTotal: number;
  difference: number;
  statusMessage: string;
};

export function calculateExpectedCash(initialCash: number, salesTotal: number, collectionsTotal: number, expensesTotal: number, loanDisbursementsTotal = 0) {
  return initialCash + salesTotal + collectionsTotal - expensesTotal - loanDisbursementsTotal;
}

export function calculateCashDifference(reportedTotal: number, expectedCash: number) {
  return reportedTotal - expectedCash;
}

export function getCashboxStatusMessage(difference: number) {
  if (difference === 0) return "Caja cuadrada correctamente";
  if (difference > 0) return "Sobra dinero en caja";
  return "Falta dinero en caja";
}

export function calculateDailySummary(input: {
  cashbox: Cashbox;
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  loans?: Loan[];
  countryCode?: string;
}): DailySummary {
  const { cashbox, sales, collections, expenses } = input;
  const loans = input.loans ?? [];
  const countryCode = input.countryCode ?? "VE";
  const salesTotal = sum(sales.map((sale) => sale.amount));
  const collectionsTotal = sum(collections.map((collection) => collection.amount));
  const expensesTotal = sum(expenses.map((expense) => expense.amount));
  const loanDisbursementsTotal = sum(loans.map((loan) => loan.principalAmount));
  const isCashMethod = (method: string) => getPaymentMethodCategory(method, countryCode) === "cash" || method === "CASH";
  const isTransferLikeMethod = (method: string) => ["bank", "card"].includes(getPaymentMethodCategory(method, countryCode)) || method === "TRANSFER";
  const isWalletMethod = (method: string) => getPaymentMethodCategory(method, countryCode) === "wallet" || method === "PIX";
  const cashSales = sum(sales.filter((sale) => isCashMethod(sale.paymentMethod)).map((sale) => sale.amount));
  const cashCollections = sum(collections.filter((collection) => isCashMethod(collection.paymentMethod)).map((collection) => collection.amount));
  const cashExpenses = sum(expenses.filter((expense) => isCashMethod(expense.paymentMethod)).map((expense) => expense.amount));
  const transferTotal = sum([
    ...sales.filter((sale) => isTransferLikeMethod(sale.paymentMethod)).map((sale) => sale.amount),
    ...collections.filter((collection) => isTransferLikeMethod(collection.paymentMethod)).map((collection) => collection.amount)
  ]);
  const pixTotal = sum([
    ...sales.filter((sale) => isWalletMethod(sale.paymentMethod)).map((sale) => sale.amount),
    ...collections.filter((collection) => isWalletMethod(collection.paymentMethod)).map((collection) => collection.amount)
  ]);
  const expectedCash = calculateExpectedCash(cashbox.initialCash, salesTotal, collectionsTotal, expensesTotal, loanDisbursementsTotal);
  const reportedTotal = cashbox.reportedCash + cashbox.reportedTransfer + cashbox.reportedPix;
  const difference = calculateCashDifference(reportedTotal, expectedCash);

  return {
    salesTotal,
    collectionsTotal,
    expensesTotal,
    cashSales,
    cashCollections,
    cashExpenses,
    loanDisbursementsTotal,
    transferTotal,
    pixTotal,
    digitalTotal: transferTotal + pixTotal,
    grossMovement: salesTotal + collectionsTotal + loanDisbursementsTotal,
    netMovement: salesTotal + collectionsTotal - expensesTotal - loanDisbursementsTotal,
    expectedCash,
    reportedTotal,
    difference,
    statusMessage: getCashboxStatusMessage(difference)
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
