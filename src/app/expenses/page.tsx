import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { ExpenseForm } from "@/components/forms/movement-form";
import { getFinancialPageData } from "@/lib/financial-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default async function ExpensesPage() {
  const { company, expenses } = await getFinancialPageData();

  return (
    <AppShell title="Gastos" subtitle="Registra gastos de ruta y descuéntalos del cierre de caja.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card><CardHeader title="Registrar gasto" description="Gasolina, comida, transporte, material u otro gasto." /><ExpenseForm company={company} /></Card>
        <Card>
          <CardHeader title="Gastos recientes" />
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-4">
                <div><p className="font-semibold">{expense.type}</p><p className="text-sm text-zinc-400">{paymentMethodLabel(expense.paymentMethod, company.countryCode)} · {expense.comment}</p></div>
                <p className="font-black text-orange-300">{formatCurrency(expense.amount, company)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
