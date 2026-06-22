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
  carryForwardNextDay?: number;
  collectionBreakdown?: {
    principalApplied: number;
    interestApplied: number;
    lateFeeApplied: number;
    additionalApplied: number;
    overpaymentAmount: number;
    installmentsCovered: number;
  };
  clientBalanceTotal?: number;
  cashboxAudit?: {
    open: number;
    closed: number;
    unbalanced: number;
  };
}) {
  const { seller, cashbox, summary, sales, collections, expenses, visitedClients } = input;
  const loans = input.loans ?? [];
  const money = (value: number) => formatCurrency(value, input.currencyConfig);

  return [
    `Cierre de ruta - ${seller.name}`,
    input.dateLabel ?? formatSpanishDate(cashbox.date),
    "",
    `Caja inicial: ${money(cashbox.initialCash)}`,
    `Ingresos extra efectivo: ${money(summary.cashSales)}`,
    `Recaudos efectivo: ${money(summary.cashCollections)}`,
    `Entradas manuales efectivo: ${money(summary.cashIncomeMovements)}`,
    `Gastos descontados: ${money(-summary.expensesTotal)}`,
    `Retiros descontados: ${money(-summary.withdrawalsTotal)}`,
    `Prestamos entregados: ${money(-summary.loanDisbursementsTotal)}`,
    "",
    `Caja fisica esperada: ${money(summary.expectedCash)}`,
    `Efectivo final reportado: ${money(cashbox.reportedCash)}`,
    `Arrastre proximo dia: ${money(input.carryForwardNextDay ?? summary.expectedCash)}`,
    `Digital / wallets: ${money(summary.pixTotal)}`,
    `Transferencia: ${money(summary.transferTotal)}`,
    "",
    `Diferencia fisica: ${money(summary.difference)}`,
    `Estado: ${summary.statusMessage}`,
    "",
    `Clientes visitados: ${visitedClients}`,
    `Prestamos creados: ${loans.length}`,
    `Ingresos extra: ${sales.length}`,
    `Recaudos realizados: ${collections.length}`,
    `Capital recuperado: ${money(input.collectionBreakdown?.principalApplied ?? 0)}`,
    `Interes recuperado: ${money(input.collectionBreakdown?.interestApplied ?? 0)}`,
    `Mora recuperada: ${money(input.collectionBreakdown?.lateFeeApplied ?? 0)}`,
    `Adicionales: ${money(input.collectionBreakdown?.additionalApplied ?? 0)}`,
    `Sobrantes/adelantos: ${money(input.collectionBreakdown?.overpaymentAmount ?? 0)}`,
    `Cuotas cubiertas: ${input.collectionBreakdown?.installmentsCovered ?? 0}`,
    `Saldo pendiente clientes: ${money(input.clientBalanceTotal ?? 0)}`,
    `Movimientos de caja: ${expenses.length}`,
    `Entradas manuales: ${money(summary.incomeMovementsTotal)}`,
    `Retiros: ${money(summary.withdrawalsTotal)}`,
    `Cajas abiertas: ${input.cashboxAudit?.open ?? 0}`,
    `Cajas cerradas: ${input.cashboxAudit?.closed ?? 0}`,
    `Cajas descuadradas: ${input.cashboxAudit?.unbalanced ?? 0}`,
    "",
    "Observacion:",
    cashbox.observations || "Sin observaciones"
  ].join("\n");
}
