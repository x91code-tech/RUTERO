import type { Cashbox, Collection, Expense, Sale, User } from "@/lib/types";
import type { DailySummary } from "@/lib/cashbox-calculations";
import type { CurrencyConfig } from "@/lib/countries";
import { formatCurrency, formatSpanishDate } from "@/lib/formatters";

export function generateWhatsAppReport(input: {
  seller: User;
  cashbox: Cashbox;
  summary: DailySummary;
  sales: Sale[];
  collections: Collection[];
  expenses: Expense[];
  visitedClients: number;
  currencyConfig?: Partial<CurrencyConfig>;
}) {
  const { seller, cashbox, summary, sales, collections, expenses, visitedClients } = input;
  const money = (value: number) => formatCurrency(value, input.currencyConfig);

  return [
    `Cierre de ruta - ${seller.name}`,
    formatSpanishDate(cashbox.date),
    "",
    `Caja inicial: ${money(cashbox.initialCash)}`,
    `Ventas: ${money(summary.salesTotal)}`,
    `Recaudos: ${money(summary.collectionsTotal)}`,
    `Gastos: ${money(summary.expensesTotal)}`,
    "",
    `Efectivo esperado: ${money(summary.expectedCash)}`,
    `Efectivo reportado: ${money(cashbox.reportedCash)}`,
    `Pix: ${money(summary.pixTotal)}`,
    `Transferencia: ${money(summary.transferTotal)}`,
    "",
    `Diferencia: ${money(summary.difference)}`,
    `Estado: ${summary.statusMessage}`,
    "",
    `Clientes visitados: ${visitedClients}`,
    `Ventas realizadas: ${sales.length}`,
    `Recaudos realizados: ${collections.length}`,
    `Gastos registrados: ${expenses.length}`,
    "",
    "Observación:",
    cashbox.observations || "Sin observaciones"
  ].join("\n");
}
