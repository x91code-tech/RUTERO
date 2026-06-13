import type { Cashbox, Collection, Expense, Sale } from "@/lib/types";
import { getPaymentMethodCategory } from "@/lib/payment-methods";

export type DailySummary = {
  salesTotal: number;
  collectionsTotal: number;
  expensesTotal: number;
  cashSales: number;
  cashCollections: number;
  cashExpenses: number;
  transferTotal: number;
  pixTotal: number;
  digitalTotal: number;
  grossMovement: number;
  netMovement: number;
  expectedCash: number;
  difference: number;
  statusMessage: string;
};

export function calculateExpectedCash(initialCash: number, cashSales: number, cashCollections: number, cashExpenses: number) {
  return initialCash + cashSales + cashCollections - cashExpenses;
}

export function calculateCashDifference(reportedCash: number, expectedCash: number) {
  return reportedCash - expectedCash;
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
  countryCode?: string;
}): DailySummary {
  const { cashbox, sales, collections, expenses } = input;
  const countryCode = input.countryCode ?? "VE";
  const salesTotal = sum(sales.map((sale) => sale.amount));
  const collectionsTotal = sum(collections.map((collection) => collection.amount));
  const expensesTotal = sum(expenses.map((expense) => expense.amount));
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
  const expectedCash = calculateExpectedCash(cashbox.initialCash, cashSales, cashCollections, cashExpenses);
  const difference = calculateCashDifference(cashbox.reportedCash, expectedCash);

  return {
    salesTotal,
    collectionsTotal,
    expensesTotal,
    cashSales,
    cashCollections,
    cashExpenses,
    transferTotal,
    pixTotal,
    digitalTotal: transferTotal + pixTotal,
    grossMovement: salesTotal + collectionsTotal,
    netMovement: salesTotal + collectionsTotal - expensesTotal,
    expectedCash,
    difference,
    statusMessage: getCashboxStatusMessage(difference)
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
