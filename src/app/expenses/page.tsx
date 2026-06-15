import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExpenseForm } from "@/components/forms/movement-form";
import { cashMovementKindLabels, getCashMovementImpact } from "@/lib/cash-movements";
import { getFinancialPageData } from "@/lib/financial-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default async function ExpensesPage() {
  const { company, expenses } = await getFinancialPageData();

  return (
    <AppShell title="Movimientos de caja" subtitle="Registra gastos, retiros y entradas que afectan la caja diaria.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
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
                  <div key={expense.id} className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] p-4">
                    <div className="min-w-0">
                      <StatusBadge tone={expense.movementKind === "INCOME" ? "green" : "red"}>
                        {cashMovementKindLabels[expense.movementKind]}
                      </StatusBadge>
                      <p className="mt-2 truncate font-semibold">{expense.type}</p>
                      <p className="truncate text-sm text-zinc-400">
                        {paymentMethodLabel(expense.paymentMethod, company.countryCode)} · {expense.comment || "Sin comentario"}
                      </p>
                    </div>
                    <p className={impact < 0 ? "shrink-0 font-black text-red-300" : "shrink-0 font-black text-emerald-300"}>
                      {formatCurrency(impact, company)}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-400">
                Todavia no hay movimientos registrados.
              </p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
