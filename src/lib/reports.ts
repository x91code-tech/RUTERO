import type { DailySummary } from "@/lib/cashbox-calculations";
import type { CurrencyConfig } from "@/lib/countries";
import { formatCurrency, formatSpanishDate } from "@/lib/formatters";
import type { Cashbox, Collection, Expense, Loan, Sale, User } from "@/lib/types";

export function generateWhatsAppReport(input: {
  seller: User;
  cashbox: Cashbox;
  summary: DailySummary;
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  loans?: Loan[];
  visitedClients: number;
  dateLabel?: string;
  currencyConfig?: Partial<CurrencyConfig>;
}) {
  const { seller, cashbox, summary, sales, collections, expenses, visitedClients } = input;
  const loans = input.loans ?? [];
  const money = (value: number) => formatCurrency(value, input.currencyConfig);

  return [
    `Cierre de ruta - ${seller.name}`,
    input.dateLabel ?? formatSpanishDate(cashbox.date),
    "",
    `Caja inicial: ${money(cashbox.initialCash)}`,
    `Ventas efectivo: ${money(summary.cashSales)}`,
    `Recaudos efectivo: ${money(summary.cashCollections)}`,
    `Entradas manuales efectivo: ${money(summary.cashIncomeMovements)}`,
    `Gastos descontados: ${money(-summary.expensesTotal)}`,
    `Retiros descontados: ${money(-summary.withdrawalsTotal)}`,
    `Prestamos entregados: ${money(-summary.loanDisbursementsTotal)}`,
    "",
    `Caja fisica esperada: ${money(summary.expectedCash)}`,
    `Efectivo final reportado: ${money(cashbox.reportedCash)}`,
    `Digital / wallets: ${money(summary.pixTotal)}`,
    `Transferencia: ${money(summary.transferTotal)}`,
    "",
    `Diferencia fisica: ${money(summary.difference)}`,
    `Estado: ${summary.statusMessage}`,
    "",
    `Clientes visitados: ${visitedClients}`,
    `Prestamos creados: ${loans.length}`,
    `Ventas realizadas: ${sales.length}`,
    `Recaudos realizados: ${collections.length}`,
    `Movimientos de caja: ${expenses.length}`,
    `Entradas manuales: ${money(summary.incomeMovementsTotal)}`,
    `Retiros: ${money(summary.withdrawalsTotal)}`,
    "",
    "Observacion:",
    cashbox.observations || "Sin observaciones"
  ].join("\n");
}
