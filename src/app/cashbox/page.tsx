import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/cards/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { demoCashbox, demoCollections, demoCompany, demoExpenses, demoSales } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/formatters";

export default function CashboxPage() {
  const summary = calculateDailySummary({ cashbox: demoCashbox, sales: demoSales, collections: demoCollections, expenses: demoExpenses });

  return (
    <AppShell title="Caja diaria" subtitle="Apertura, movimientos automáticos, cierre y diferencias del día.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Caja inicial" value={formatCurrency(demoCashbox.initialCash, demoCompany)} />
        <MetricCard label="Ventas en efectivo" value={formatCurrency(summary.cashSales, demoCompany)} />
        <MetricCard label="Recaudos en efectivo" value={formatCurrency(summary.cashCollections, demoCompany)} />
        <MetricCard label="Gastos en efectivo" value={formatCurrency(summary.cashExpenses, demoCompany)} tone="orange" />
        <MetricCard label="Caja esperada" value={formatCurrency(summary.expectedCash, demoCompany)} />
        <MetricCard label="Caja reportada" value={formatCurrency(demoCashbox.reportedCash, demoCompany)} />
        <MetricCard label="Diferencia" value={formatCurrency(summary.difference, demoCompany)} tone={summary.difference === 0 ? "green" : "red"} />
        <MetricCard label="Total general del día" value={formatCurrency(summary.grossMovement, demoCompany)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Cerrar caja" description="El vendedor no puede editar una caja cerrada; admin corrige con auditoría." />
          <form className="grid gap-4">
            <Field label="Efectivo reportado"><Input type="number" defaultValue={demoCashbox.reportedCash} /></Field>
            <Field label="Transferencia reportada"><Input type="number" defaultValue={demoCashbox.reportedTransfer} /></Field>
            <Field label="Pix reportado"><Input type="number" defaultValue={demoCashbox.reportedPix} /></Field>
            <Field label="Observaciones"><Textarea defaultValue={demoCashbox.observations} /></Field>
            <Button type="button">Cerrar caja</Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="Resumen calculado" description={summary.statusMessage} />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Total por Pix", summary.pixTotal],
              ["Total por transferencia", summary.transferTotal],
              ["Movimiento bruto", summary.grossMovement],
              ["Movimiento neto", summary.netMovement],
              ["Ventas", summary.salesTotal],
              ["Recaudos", summary.collectionsTotal],
              ["Gastos", summary.expensesTotal],
              ["Digital total", summary.digitalTotal]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/[0.04] p-4">
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="mt-2 text-xl font-black">{formatCurrency(Number(value), demoCompany)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
