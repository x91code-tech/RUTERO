import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/cards/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { getCashboxPageData } from "@/lib/cashbox-data";
import { formatCurrency } from "@/lib/formatters";
import { closeCashboxAction } from "@/server/actions/financial-actions";

export default async function CashboxPage() {
  const { cashbox, collections, company, expenses, loans, sales } = await getCashboxPageData();
  const summary = calculateDailySummary({ cashbox, sales, collections, expenses, loans, countryCode: company.countryCode });

  return (
    <AppShell title="Caja diaria" subtitle="Movimientos automaticos, cierre y diferencias del dia.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Caja inicial" value={formatCurrency(cashbox.initialCash, company)} />
        <MetricCard label="Prestamos entregados" value={formatCurrency(summary.loanDisbursementsTotal, company)} tone="orange" />
        <MetricCard label="Recaudos efectivo" value={formatCurrency(summary.cashCollections, company)} />
        <MetricCard label="Gastos efectivo" value={formatCurrency(summary.cashExpenses, company)} tone="orange" />
        <MetricCard label="Caja esperada" value={formatCurrency(summary.expectedCash, company)} />
        <MetricCard label="Caja reportada" value={formatCurrency(cashbox.reportedCash, company)} />
        <MetricCard label="Diferencia" value={formatCurrency(summary.difference, company)} tone={summary.difference === 0 ? "green" : "red"} />
        <MetricCard label="Total del dia" value={formatCurrency(summary.grossMovement, company)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Cerrar caja" description="Guarda el reporte del usuario actual y deja auditoria." />
          <form action={closeCashboxAction} className="grid gap-4">
            <Field label="Caja inicial"><Input name="initialCash" type="number" defaultValue={cashbox.initialCash} min="0" step="0.01" /></Field>
            <Field label="Efectivo reportado"><Input name="reportedCash" type="number" defaultValue={cashbox.reportedCash || summary.expectedCash} min="0" step="0.01" /></Field>
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
              ["Movimiento bruto", summary.grossMovement],
              ["Movimiento neto", summary.netMovement],
              ["Ventas contado", summary.salesTotal],
              ["Prestamos entregados", summary.loanDisbursementsTotal],
              ["Recaudos", summary.collectionsTotal],
              ["Gastos", summary.expensesTotal],
              ["Digital total", summary.digitalTotal]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/[0.04] p-4">
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="mt-2 text-xl font-black">{formatCurrency(Number(value), company)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
