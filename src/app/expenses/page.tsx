import { Banknote, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/cards/metric-card";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExpenseForm } from "@/components/forms/movement-form";
import { cashMovementKindLabels, getCashMovementImpact } from "@/lib/cash-movements";
import { getFinancialPageData } from "@/lib/financial-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default async function ExpensesPage() {
  const { company, expenses } = await getFinancialPageData();
  const incomeTotal = expenses.filter((expense) => expense.movementKind === "INCOME").reduce((total, expense) => total + expense.amount, 0);
  const expenseTotal = expenses.filter((expense) => expense.movementKind === "EXPENSE").reduce((total, expense) => total + expense.amount, 0);
  const withdrawalTotal = expenses.filter((expense) => expense.movementKind === "WITHDRAWAL").reduce((total, expense) => total + expense.amount, 0);
  const netTotal = expenses.reduce((total, expense) => total + getCashMovementImpact(expense.amount, expense.movementKind), 0);

  return (
    <AppShell title="Movimientos de caja" subtitle="Registra gastos, retiros y entradas que afectan la caja diaria.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Entradas" value={formatCurrency(incomeTotal, company)} icon={<TrendingUp className="h-4 w-4" />} tone="green" />
        <MetricCard label="Gastos" value={formatCurrency(-expenseTotal, company)} icon={<TrendingDown className="h-4 w-4" />} tone={expenseTotal > 0 ? "red" : "green"} />
        <MetricCard label="Retiros" value={formatCurrency(-withdrawalTotal, company)} icon={<Banknote className="h-4 w-4" />} tone={withdrawalTotal > 0 ? "orange" : "green"} />
        <MetricCard label="Neto caja" value={formatCurrency(netTotal, company)} tone={netTotal >= 0 ? "green" : "red"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card id="registrar-movimiento">
          <CardHeader title="Registrar movimiento" description="Gasto y retiro restan caja. Entrada suma caja." />
          <ExpenseForm company={company} />
        </Card>
        <Card>
          <CardHeader title="Movimientos recientes" />
          <div className="space-y-3">
            {expenses.length > 0 ? (
              expenses.map((expense) => {
                const impact = getCashMovementImpact(expense.amount, expense.movementKind);

                return (
                  <div key={expense.id} className="interactive-surface flex items-center justify-between gap-4 rounded-lg p-4">
                    <div className="min-w-0">
                      <StatusBadge tone={expense.movementKind === "INCOME" ? "green" : "red"}>
                        {cashMovementKindLabels[expense.movementKind]}
                      </StatusBadge>
                      <p className="mt-2 truncate font-semibold">{expense.type}</p>
                      <p className="truncate text-sm text-zinc-400">
                        {paymentMethodLabel(expense.paymentMethod, company.countryCode)} - {expense.comment || "Sin comentario"}
                      </p>
                    </div>
                    <p className={impact < 0 ? "shrink-0 font-black text-red-300" : "shrink-0 font-black text-emerald-300"}>
                      {formatCurrency(impact, company)}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-400">
                Todavia no hay movimientos registrados.
              </p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
