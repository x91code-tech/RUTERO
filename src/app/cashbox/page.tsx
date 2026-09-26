import type { ReactNode } from "react";
import { Banknote, Landmark, TrendingDown, TrendingUp, Users, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/cards/metric-card";
import { CountryScopeForm } from "@/components/filters/country-scope-form";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { getCashboxPageData } from "@/lib/cashbox-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";
import { closeCashboxAction, openTodayCashboxesAction } from "@/server/actions/financial-actions";

export default async function CashboxPage({ searchParams }: { searchParams: Promise<{ countryCode?: string }> }) {
  const { countryCode: requestedCountryCode } = await searchParams;
  const { cashbox, canOpenCashboxes, collectableClientsToday, collectorCount, collections, company, countryCode, currentUser, expectedCollectionToday, expenses, loans, movements, openedCashboxes, sales } = await getCashboxPageData(requestedCountryCode);
  const summary = calculateDailySummary({ cashbox, sales, collections, expenses, loans, countryCode: cashbox.countryCode ?? company.countryCode });
  const isCollector = currentUser?.role === "SELLER";
  const projectedClosingCash = cashbox.status === "OPEN" ? summary.expectedCash : cashbox.reportedCash;
  const cashboxIsOpen = cashbox.status === "OPEN";
  const pendingCashboxesToOpen = Math.max(collectorCount - openedCashboxes, 0);
  const visitedClients = new Set([
    ...collections.map((collection) => collection.clientId),
    ...loans.map((loan) => loan.clientId),
    ...sales.map((sale) => sale.clientId)
  ]).size;
  const calculatedRows: [string, number][] = [
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
  ];

  return (
    <AppShell title="Caja diaria" subtitle="Movimientos automaticos, cierre y diferencias del dia.">
      {canOpenCashboxes ? <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-white/10 bg-carbon-900 p-3 sm:p-4">
        <p className="text-sm text-zinc-400">Consulta y abre cajas por país; los importes no se mezclan entre monedas.</p>
        <CountryScopeForm countryCode={countryCode} />
      </div> : null}
      <section className="mb-3 grid grid-cols-2 gap-2 md:hidden">
        <div className="col-span-2 flex items-end justify-between gap-4 rounded-xl border border-white/10 bg-carbon-900 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-zinc-500">Caja fisica esperada</p>
            <p className={summary.expectedCash < 0 ? "mt-1 truncate text-2xl font-bold tracking-[-0.04em] tabular-nums text-red-300" : "mt-1 truncate text-2xl font-bold tracking-[-0.04em] tabular-nums text-emerald-300"}>
              {formatCurrency(summary.expectedCash, cashbox)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-zinc-500">Diferencia</p>
            <p className={summary.difference === 0 ? "mt-1 text-base font-semibold tabular-nums text-emerald-300" : "mt-1 text-base font-semibold tabular-nums text-red-300"}>
              {formatCurrency(summary.difference, cashbox)}
            </p>
          </div>
        </div>
        <CompactMetric label="Efectivo reportado" value={formatCurrency(cashbox.reportedCash, cashbox)} />
        <CompactMetric label="Arrastre mañana" value={formatCurrency(projectedClosingCash, cashbox)} />
        <details className="col-span-2 rounded-xl border border-white/10 bg-carbon-900 px-3.5 py-2.5">
          <summary className="cursor-pointer list-none text-xs font-semibold text-zinc-300 marker:content-none">
            Ver todos los indicadores
            <span className="float-right text-zinc-500">+</span>
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 pt-3">
            <CompactMetric label="Caja inicial" value={formatCurrency(cashbox.initialCash, cashbox)} />
            <CompactMetric label="Prestamos entregados" value={formatCurrency(-summary.loanDisbursementsTotal, cashbox)} tone="red" />
            <CompactMetric label="Entradas efectivo" value={formatCurrency(summary.cashInflows, cashbox)} />
            <CompactMetric label="Salidas efectivo" value={formatCurrency(-summary.cashOutflows, cashbox)} tone="red" />
            <CompactMetric label="Digital declarado" value={formatCurrency(summary.digitalTotal, cashbox)} />
          </div>
        </details>
      </section>

      <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Caja inicial" value={formatCurrency(cashbox.initialCash, cashbox)} />
        <MetricCard label="Prestamos entregados" value={formatCurrency(-summary.loanDisbursementsTotal, cashbox)} tone="red" />
        <MetricCard label="Entradas efectivo" value={formatCurrency(summary.cashInflows, cashbox)} />
        <MetricCard label="Salidas efectivo" value={formatCurrency(-summary.cashOutflows, cashbox)} tone="red" />
        <MetricCard label="Caja fisica esperada" value={formatCurrency(summary.expectedCash, cashbox)} tone={summary.expectedCash < 0 ? "red" : "green"} />
        <MetricCard label="Efectivo final reportado" value={formatCurrency(cashbox.reportedCash, cashbox)} tone={cashbox.reportedCash < 0 ? "red" : "green"} />
        <MetricCard label="Diferencia fisica" value={formatCurrency(summary.difference, cashbox)} tone={summary.difference === 0 ? "green" : "red"} />
        <MetricCard label="Digital declarado" value={formatCurrency(summary.digitalTotal, cashbox)} />
        <MetricCard label="Arrastre manana" value={formatCurrency(projectedClosingCash, cashbox)} tone={projectedClosingCash < 0 ? "red" : "green"} />
      </div>

      <div className="mt-3 grid gap-3 sm:mt-6 sm:gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-3 sm:p-5">
          {isCollector ? (
            <>
              <CardHeader title="Resumen de caja" description={cashboxIsOpen ? "Revisa el efectivo antes de cerrar." : "La caja de hoy ya fue cerrada."} />
              <CashboxCloseSummary
                cashbox={cashbox}
                collectableClientsToday={collectableClientsToday}
                company={cashbox}
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
                  <p className="mt-2 text-sm text-zinc-300">El cierre de hoy ya quedo guardado. Puedes seguir revisando tu ruta, clientes y movimientos; manana se abre una nueva caja.</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <LinkButton href="/seller" variant="secondary">Volver a ruta</LinkButton>
                    <LinkButton href="/dashboard" variant="secondary">Ver dashboard</LinkButton>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <CardHeader title="Abrir cajas de hoy" description="Crea la caja diaria de cada cobrador usando su efectivo final cerrado anterior como caja inicial." />
              <div className="grid gap-3">
                {pendingCashboxesToOpen > 0 ? (
                  <>
                    <div className="rounded-lg border border-white/10 bg-carbon-950 px-3 py-2.5 text-xs text-zinc-400 sm:rounded-xl sm:p-4 sm:text-sm">
                      <p>Cajas abiertas hoy: <span className="font-semibold text-white">{openedCashboxes}</span> / {collectorCount}</p>
                      <p className="mt-1">Pendientes por abrir: <span className="font-semibold text-white">{pendingCashboxesToOpen}</span></p>
                      <p className="mt-2 text-zinc-500">La apertura automatica por hora requiere un programador en la VPS; por ahora queda control manual desde aqui.</p>
                    </div>
                    {canOpenCashboxes ? (
                      <form action={openTodayCashboxesAction}>
                              <input type="hidden" name="countryCode" value={countryCode} />
                              <Button type="submit">Abrir cajas pendientes</Button>
                            </form>
                    ) : null}
                  </>
                ) : (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-500/15 bg-emerald-500/[0.05] px-3 py-2.5 text-xs sm:rounded-xl sm:p-4 sm:text-sm">
                    <span className="text-zinc-400">Cajas listas para hoy</span>
                    <span className="font-semibold text-emerald-300">{openedCashboxes} / {collectorCount}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
        <Card className="p-3 sm:p-5">
          <CardHeader title="Resumen calculado" description={summary.statusMessage} />
          <div className="hidden grid-cols-2 gap-2 md:grid sm:gap-3">
            {calculatedRows.map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-lg bg-carbon-950 px-3 py-2.5 sm:rounded-xl sm:p-4">
                <p className="truncate text-xs text-zinc-500 sm:text-sm sm:text-zinc-400">{label}</p>
                <p className={Number(value) < 0 ? "mt-1 truncate text-base font-semibold tabular-nums text-red-300 sm:mt-2 sm:text-xl sm:font-black" : "mt-1 truncate text-base font-semibold tabular-nums sm:mt-2 sm:text-xl sm:font-black"}>{formatCurrency(Number(value), cashbox)}</p>
              </div>
            ))}
          </div>
          <details className="rounded-lg border border-white/10 bg-carbon-950 px-3.5 py-2.5 md:hidden">
            <summary className="cursor-pointer list-none text-xs font-semibold text-zinc-300 marker:content-none">
              Mostrar desglose completo <span className="float-right text-zinc-500">{calculatedRows.length}</span>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-white/10 pt-3">
              {calculatedRows.map(([label, value]) => (
                <CompactMetric key={label} label={label} value={formatCurrency(value, cashbox)} tone={value < 0 ? "red" : "neutral"} />
              ))}
            </div>
          </details>
        </Card>
      </div>

      <Card className="mt-3 p-3 sm:mt-6 sm:p-5">
        <CardHeader title="Movimientos de caja del dia" description="Entradas en positivo y salidas en negativo." />
        {movements.length > 0 ? (
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
                {movements.map((movement) => (
                  <tr key={`${movement.type}-${movement.id}`}>
                    <td className="py-3">
                      <StatusBadge tone={movementTone(movement.type)}>
                        {movement.type}
                      </StatusBadge>
                    </td>
                    <td className="max-w-[20rem] truncate py-3 font-medium">{movement.description}</td>
                    <td className="py-3 text-zinc-300">{paymentMethodLabel(movement.paymentMethod, cashbox.countryCode ?? company.countryCode)}</td>
                    <td className="py-3 text-zinc-400">{new Date(movement.date).toLocaleDateString(cashbox.countryCode === "BR" ? "pt-BR" : company.locale)}</td>
                    <td className={movement.amount < 0 ? "py-3 text-right font-black text-red-300" : "py-3 text-right font-black text-emerald-300"}>
                      {formatCurrency(movement.amount, cashbox)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-5 text-center text-xs text-zinc-500 sm:rounded-xl sm:p-8 sm:text-sm">
            Todavia no hay movimientos registrados para esta caja.
          </p>
        )}
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
  const visitTarget = Math.max(collectableClientsToday, visitedClients);
  const progress = visitTarget > 0 ? Math.min((visitedClients / visitTarget) * 100, 100) : 0;

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-white/10 bg-carbon-950 p-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-400">
            <Banknote className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-400">Caja actual</p>
            <p className={projectedClosingCash < 0 ? "truncate text-3xl font-black text-red-300" : "truncate text-3xl font-black text-white"}>
              {formatCurrency(projectedClosingCash, company)}
            </p>
            <p className="truncate text-sm text-zinc-400">Recaudo esperado: {formatCurrency(expectedCollectionToday, company)}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-zinc-300">Clientes visitados</p>
          <p className="font-black text-white">{visitedClients} de {visitTarget}</p>
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
    <div className="rounded-lg border border-white/10 bg-carbon-950 px-3 py-2.5 sm:rounded-xl sm:p-3">
      <div className="flex items-center gap-2 text-zinc-500">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <p className="truncate text-xs font-medium text-zinc-400">{label}</p>
      </div>
      <p className={`mt-1.5 truncate text-base font-semibold tabular-nums sm:mt-2 sm:text-xl sm:font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function CompactMetric({ label, tone = "neutral", value }: { label: string; tone?: "neutral" | "red"; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[0.6rem] font-medium uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${tone === "red" ? "text-red-300" : "text-zinc-200"}`}>{value}</p>
    </div>
  );
}

function movementTone(type: string): "green" | "red" | "orange" | "gray" | "blue" {
  if (type === "Prestamo") return "orange";
  if (type === "Gasto" || type === "Retiro") return "red";
  if (type === "Recaudo") return "blue";
  return "green";
}
