import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/cards/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { getCashboxPageData } from "@/lib/cashbox-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";
import { closeCashboxAction } from "@/server/actions/financial-actions";

export default async function CashboxPage() {
  const { cashbox, collections, company, expenses, loans, movements, sales } = await getCashboxPageData();
  const summary = calculateDailySummary({ cashbox, sales, collections, expenses, loans, countryCode: company.countryCode });

  return (
    <AppShell title="Caja diaria" subtitle="Movimientos automaticos, cierre y diferencias del dia.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Caja inicial" value={formatCurrency(cashbox.initialCash, company)} />
        <MetricCard label="Prestamos entregados" value={formatCurrency(-summary.loanDisbursementsTotal, company)} tone="red" />
        <MetricCard label="Recaudos efectivo" value={formatCurrency(summary.cashCollections, company)} />
        <MetricCard label="Gastos del dia" value={formatCurrency(-summary.expensesTotal, company)} tone="red" />
        <MetricCard label="Caja esperada" value={formatCurrency(summary.expectedCash, company)} />
        <MetricCard label="Total reportado" value={formatCurrency(summary.reportedTotal, company)} />
        <MetricCard label="Diferencia" value={formatCurrency(summary.difference, company)} tone={summary.difference === 0 ? "green" : "red"} />
        <MetricCard label="Movimiento neto" value={formatCurrency(summary.netMovement, company)} tone={summary.netMovement >= 0 ? "green" : "red"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Cerrar caja" description="Guarda el reporte del usuario actual y deja auditoria." />
          <form action={closeCashboxAction} className="grid gap-4">
            <Field label="Caja inicial"><Input name="initialCash" type="number" defaultValue={cashbox.initialCash} min="0" step="0.01" /></Field>
            <Field label="Efectivo reportado"><Input name="reportedCash" type="number" defaultValue={cashbox.reportedCash} min="0" step="0.01" /></Field>
            <Field label="Transferencia reportada"><Input name="reportedTransfer" type="number" defaultValue={cashbox.reportedTransfer || summary.transferTotal} min="0" step="0.01" /></Field>
            <Field label="Digital reportado"><Input name="reportedPix" type="number" defaultValue={cashbox.reportedPix || summary.pixTotal} min="0" step="0.01" /></Field>
            <Field label="Observaciones"><Textarea name="observations" defaultValue={cashbox.observations} placeholder="Notas del cierre de caja" /></Field>
            <Button type="submit">Cerrar caja</Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Resumen calculado" description={summary.statusMessage} />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Digital / wallets", summary.pixTotal],
              ["Transferencias y tarjetas", summary.transferTotal],
              ["Entradas brutas", summary.salesTotal + summary.collectionsTotal],
              ["Salidas del dia", -(summary.expensesTotal + summary.loanDisbursementsTotal)],
              ["Movimiento neto", summary.netMovement],
              ["Ventas contado", summary.salesTotal],
              ["Prestamos entregados", -summary.loanDisbursementsTotal],
              ["Recaudos", summary.collectionsTotal],
              ["Gastos", -summary.expensesTotal],
              ["Gastos efectivo", -summary.cashExpenses],
              ["Total reportado", summary.reportedTotal],
              ["Digital total", summary.digitalTotal]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/[0.04] p-4">
                <p className="text-sm text-zinc-400">{label}</p>
                <p className={Number(value) < 0 ? "mt-2 text-xl font-black text-red-300" : "mt-2 text-xl font-black"}>{formatCurrency(Number(value), company)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Movimientos de caja del dia" description="Entradas en positivo y salidas en negativo." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-zinc-400">
              <tr>
                <th className="pb-3">Tipo</th>
                <th className="pb-3">Detalle</th>
                <th className="pb-3">Metodo</th>
                <th className="pb-3">Fecha</th>
                <th className="pb-3 text-right">Impacto en caja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {movements.length > 0 ? (
                movements.map((movement) => (
                  <tr key={`${movement.type}-${movement.id}`}>
                    <td className="py-3">
                      <StatusBadge tone={movement.type === "Gasto" ? "red" : movement.type === "Prestamo" ? "orange" : "green"}>
                        {movement.type}
                      </StatusBadge>
                    </td>
                    <td className="max-w-[20rem] truncate py-3 font-medium">{movement.description}</td>
                    <td className="py-3 text-zinc-300">{paymentMethodLabel(movement.paymentMethod, company.countryCode)}</td>
                    <td className="py-3 text-zinc-400">{new Date(movement.date).toLocaleDateString(company.locale)}</td>
                    <td className={movement.amount < 0 ? "py-3 text-right font-black text-red-300" : "py-3 text-right font-black text-emerald-300"}>
                      {formatCurrency(movement.amount, company)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-6 text-center text-zinc-400" colSpan={5}>
                    Todavia no hay movimientos registrados para esta caja.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
