import type { ReactNode } from "react";
import { Banknote, Landmark, TrendingDown, TrendingUp, Users, WalletCards } from "lucide-react";
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
  const { cashbox, canOpenCashboxes, collectableClientsToday, collectorCount, collections, company, currentUser, expectedCollectionToday, expenses, loans, movements, openedCashboxes, sales } = await getCashboxPageData();
  const summary = calculateDailySummary({ cashbox, sales, collections, expenses, loans, countryCode: company.countryCode });
  const isCollector = currentUser?.role === "SELLER";
  const projectedClosingCash = cashbox.status === "OPEN" ? summary.expectedCash : cashbox.reportedCash;
  const cashboxIsOpen = cashbox.status === "OPEN";
  const visitedClients = new Set([
    ...collections.map((collection) => collection.clientId),
    ...loans.map((loan) => loan.clientId),
    ...sales.map((sale) => sale.clientId)
  ]).size;

  return (
    <AppShell title="Caja diaria" subtitle="Movimientos automaticos, cierre y diferencias del dia.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Caja inicial" value={formatCurrency(cashbox.initialCash, company)} />
        <MetricCard label="Prestamos entregados" value={formatCurrency(-summary.loanDisbursementsTotal, company)} tone="red" />
        <MetricCard label="Entradas efectivo" value={formatCurrency(summary.cashInflows, company)} />
        <MetricCard label="Salidas efectivo" value={formatCurrency(-summary.cashOutflows, company)} tone="red" />
        <MetricCard label="Caja fisica esperada" value={formatCurrency(summary.expectedCash, company)} tone={summary.expectedCash < 0 ? "red" : "green"} />
        <MetricCard label="Efectivo final reportado" value={formatCurrency(cashbox.reportedCash, company)} tone={cashbox.reportedCash < 0 ? "red" : "green"} />
        <MetricCard label="Diferencia fisica" value={formatCurrency(summary.difference, company)} tone={summary.difference === 0 ? "green" : "red"} />
        <MetricCard label="Digital declarado" value={formatCurrency(summary.digitalTotal, company)} />
        <MetricCard label="Arrastre manana" value={formatCurrency(projectedClosingCash, company)} tone={projectedClosingCash < 0 ? "red" : "green"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          {isCollector ? (
            <>
              <CardHeader title="Resumen de caja" description={cashboxIsOpen ? "Revisa el efectivo antes de cerrar." : "La caja de hoy ya fue cerrada."} />
              <CashboxCloseSummary
                cashbox={cashbox}
                collectableClientsToday={collectableClientsToday}
                company={company}
                expectedCollectionToday={expectedCollectionToday}
                projectedClosingCash={projectedClosingCash}
                summary={summary}
                visitedClients={visitedClients}
              />
              {cashboxIsOpen ? (
                <form action={closeCashboxAction} className="mt-4 grid gap-3">
                  <Field label="Efectivo final reportado"><Input name="reportedCash" type="number" defaultValue={projectedClosingCash} step="0.01" /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Transferencia reportada"><Input name="reportedTransfer" type="number" defaultValue={cashbox.reportedTransfer || summary.transferTotal} min="0" step="0.01" /></Field>
                    <Field label="Digital / wallet reportado"><Input name="reportedPix" type="number" defaultValue={cashbox.reportedPix || summary.pixTotal} min="0" step="0.01" /></Field>
                  </div>
                  <Field label="Observaciones"><Textarea name="observations" defaultValue={cashbox.observations} placeholder="Notas del cierre de caja" /></Field>
                  <Button type="submit">Cerrar caja</Button>
                </form>
              ) : (
                <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <StatusBadge tone={summary.difference === 0 ? "green" : "orange"}>
                    {summary.difference === 0 ? "Caja cerrada" : "Cerrada con diferencia"}
                  </StatusBadge>
                  <p className="mt-2 text-sm text-zinc-300">Para abrir otra caja debe iniciar un nuevo dia desde administracion.</p>
                </div>
              )}
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
              ["Ingresos extra efectivo", summary.cashSales],
              ["Recaudos efectivo", summary.cashCollections],
              ["Entradas manuales efectivo", summary.cashIncomeMovements],
              ["Gastos efectivo", -summary.cashExpenses],
              ["Retiros efectivo", -summary.cashWithdrawals],
              ["Prestamos entregados", -summary.loanDisbursementsTotal],
              ["Entradas efectivo total", summary.cashInflows],
              ["Salidas efectivo total", -summary.cashOutflows],
              ["Movimiento neto fisico", summary.expectedCash - cashbox.initialCash],
              ["Arrastre proximo dia", projectedClosingCash],
              ["Gastos totales", -summary.expensesTotal],
              ["Retiros totales", -summary.withdrawalsTotal],
              ["Entradas manuales", summary.incomeMovementsTotal],
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
                      <StatusBadge tone={movementTone(movement.type)}>
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

function CashboxCloseSummary({
  cashbox,
  collectableClientsToday,
  company,
  expectedCollectionToday,
  projectedClosingCash,
  summary,
  visitedClients
}: {
  cashbox: { initialCash: number };
  collectableClientsToday: number;
  company: Parameters<typeof formatCurrency>[1];
  expectedCollectionToday: number;
  projectedClosingCash: number;
  summary: ReturnType<typeof calculateDailySummary>;
  visitedClients: number;
}) {
  const progress = collectableClientsToday > 0 ? Math.min((visitedClients / collectableClientsToday) * 100, 100) : 0;

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400">
            <Banknote className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-400">Caja actual</p>
            <p className={projectedClosingCash < 0 ? "truncate text-3xl font-black text-red-300" : "truncate text-3xl font-black text-white"}>
              {formatCurrency(projectedClosingCash, company)}
            </p>
            <p className="truncate text-sm text-zinc-400">Recaudo pretendido: {formatCurrency(expectedCollectionToday, company)}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-zinc-300">Clientes visitados</p>
          <p className="font-black text-white">{visitedClients} de {collectableClientsToday}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CashboxMiniTile icon={<Banknote className="h-5 w-5" />} label="Caja inicial" value={formatCurrency(cashbox.initialCash, company)} tone={cashbox.initialCash < 0 ? "red" : "neutral"} />
        <CashboxMiniTile icon={<TrendingUp className="h-5 w-5" />} label="Entradas" value={formatCurrency(summary.cashIncomeMovements, company)} />
        <CashboxMiniTile icon={<WalletCards className="h-5 w-5" />} label="Recaudos" value={formatCurrency(summary.cashCollections, company)} tone="green" />
        <CashboxMiniTile icon={<Landmark className="h-5 w-5" />} label="Prestamos" value={formatCurrency(-summary.loanDisbursementsTotal, company)} tone="red" />
        <CashboxMiniTile icon={<TrendingDown className="h-5 w-5" />} label="Gastos" value={formatCurrency(-summary.cashExpenses, company)} tone="red" />
        <CashboxMiniTile icon={<Users className="h-5 w-5" />} label="Retiros" value={formatCurrency(-summary.cashWithdrawals, company)} tone="red" />
      </div>
    </div>
  );
}

function CashboxMiniTile({ icon, label, tone = "neutral", value }: { icon: ReactNode; label: string; tone?: "neutral" | "green" | "red"; value: string }) {
  const toneClass = tone === "green" ? "text-emerald-300" : tone === "red" ? "text-red-300" : "text-white";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center gap-2 text-brand-400">
        {icon}
        <p className="truncate text-sm font-semibold text-zinc-300">{label}</p>
      </div>
      <p className={`mt-2 truncate text-xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function movementTone(type: string): "green" | "red" | "orange" | "gray" | "blue" {
  if (type === "Prestamo") return "orange";
  if (type === "Gasto" || type === "Retiro") return "red";
  if (type === "Recaudo") return "blue";
  return "green";
}
