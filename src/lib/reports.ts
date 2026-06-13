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
    `Ventas: ${money(summary.salesTotal)}`,
    `Recaudos: ${money(summary.collectionsTotal)}`,
    `Gastos: ${money(summary.expensesTotal)}`,
    `Prestamos entregados: ${money(summary.loanDisbursementsTotal)}`,
    "",
    `Caja esperada: ${money(summary.expectedCash)}`,
    `Total reportado: ${money(summary.reportedTotal)}`,
    `Efectivo reportado: ${money(cashbox.reportedCash)}`,
    `Pix: ${money(summary.pixTotal)}`,
    `Transferencia: ${money(summary.transferTotal)}`,
    "",
    `Diferencia: ${money(summary.difference)}`,
    `Estado: ${summary.statusMessage}`,
    "",
    `Clientes visitados: ${visitedClients}`,
    `Prestamos creados: ${loans.length}`,
    `Ventas realizadas: ${sales.length}`,
    `Recaudos realizados: ${collections.length}`,
    `Gastos registrados: ${expenses.length}`,
    "",
    "Observacion:",
    cashbox.observations || "Sin observaciones"
  ].join("\n");
}
