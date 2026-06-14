import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/cards/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { getCashboxPageData } from "@/lib/cashbox-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";
import { closeCashboxAction, openTodayCashboxesAction } from "@/server/actions/financial-actions";

export default async function CashboxPage() {
  const { cashbox, canOpenCashboxes, collectorCount, collections, company, currentUser, expenses, loans, movements, openedCashboxes, sales } = await getCashboxPageData();
  const summary = calculateDailySummary({ cashbox, sales, collections, expenses, loans, countryCode: company.countryCode });
  const isCollector = currentUser?.role === "SELLER";

  return (
    <AppShell title="Caja diaria" subtitle="Movimientos automaticos, cierre y diferencias del dia.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Caja inicial" value={formatCurrency(cashbox.initialCash, company)} />
        <MetricCard label="Prestamos entregados" value={formatCurrency(-summary.loanDisbursementsTotal, company)} tone="red" />
        <MetricCard label="Recaudos efectivo" value={formatCurrency(summary.cashCollections, company)} />
        <MetricCard label="Gastos efectivo" value={formatCurrency(-summary.cashExpenses, company)} tone="red" />
        <MetricCard label="Caja fisica esperada" value={formatCurrency(summary.expectedCash, company)} tone={summary.expectedCash < 0 ? "red" : "green"} />
        <MetricCard label="Efectivo final reportado" value={formatCurrency(cashbox.reportedCash, company)} tone={cashbox.reportedCash < 0 ? "red" : "green"} />
        <MetricCard label="Diferencia fisica" value={formatCurrency(summary.difference, company)} tone={summary.difference === 0 ? "green" : "red"} />
        <MetricCard label="Digital declarado" value={formatCurrency(summary.digitalTotal, company)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          {isCollector ? (
            <>
              <CardHeader title="Cerrar caja" description="La caja fisica puede quedar en negativo si se entrego dinero que no estaba en caja." />
              <form action={closeCashboxAction} className="grid gap-4">
                <Field label="Caja inicial"><Input name="initialCash" type="number" defaultValue={cashbox.initialCash} step="0.01" /></Field>
                <Field label="Efectivo final reportado"><Input name="reportedCash" type="number" defaultValue={cashbox.reportedCash || summary.expectedCash} step="0.01" /></Field>
                <Field label="Transferencia reportada"><Input name="reportedTransfer" type="number" defaultValue={cashbox.reportedTransfer || summary.transferTotal} min="0" step="0.01" /></Field>
                <Field label="Digital / wallet reportado"><Input name="reportedPix" type="number" defaultValue={cashbox.reportedPix || summary.pixTotal} min="0" step="0.01" /></Field>
                <Field label="Observaciones"><Textarea name="observations" defaultValue={cashbox.observations} placeholder="Notas del cierre de caja" /></Field>
                <Button type="submit">Cerrar caja</Button>
              </form>
            </>
          ) : (
            <>
              <CardHeader title="Abrir cajas de hoy" description="Crea la caja diaria de cada cobrador usando su efectivo final cerrado anterior como caja inicial." />
              <div className="grid gap-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
                  <p>Cajas abiertas hoy: <span className="font-bold text-white">{openedCashboxes}</span> / {collectorCount}</p>
                  <p className="mt-2 text-zinc-500">La apertura automatica por hora requiere un programador en la VPS; por ahora queda control manual desde aqui.</p>
                </div>
                {canOpenCashboxes ? (
                  <form action={openTodayCashboxesAction}>
                    <Button type="submit">Abrir cajas pendientes</Button>
                  </form>
                ) : null}
              </div>
            </>
          )}
        </Card>
        <Card>
          <CardHeader title="Resumen calculado" description={summary.statusMessage} />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Digital / wallets", summary.pixTotal],
              ["Transferencias y tarjetas", summary.transferTotal],
              ["Entradas efectivo", summary.cashSales + summary.cashCollections],
              ["Salidas efectivo", -(summary.cashExpenses + summary.loanDisbursementsTotal)],
              ["Movimiento neto fisico", summary.expectedCash - cashbox.initialCash],
              ["Ventas efectivo", summary.cashSales],
              ["Prestamos entregados", -summary.loanDisbursementsTotal],
              ["Recaudos efectivo", summary.cashCollections],
              ["Gastos totales", -summary.expensesTotal],
              ["Gastos efectivo", -summary.cashExpenses],
              ["Total declarado", summary.reportedTotal],
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
