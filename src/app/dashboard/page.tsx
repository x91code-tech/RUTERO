import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminAnalytics } from "@/components/charts/admin-analytics";
import { CountryScopeForm } from "@/components/filters/country-scope-form";
import { getCurrencyConfig } from "@/lib/countries";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ countryCode?: string }> }) {
  const { countryCode: requestedCountryCode } = await searchParams;
  const { analytics, cashboxRows, collectorPerformance, company: baseCompany, countryCode, metrics, notifications, overdueLoanRows, recentMovements, renewalCandidateRows } = await getDashboardData(requestedCountryCode);
  const company = { ...baseCompany, ...getCurrencyConfig({ countryCode }) };
  const cashNetToday = metrics.cashInflowsToday - metrics.cashOutflowsToday;
  const collectionProgress = metrics.expectedToday > 0
    ? Math.min((metrics.collectedToday / metrics.expectedToday) * 100, 100)
    : 0;
  const additionalMetrics = [
    ["Capital en calle", formatCurrency(metrics.activePrincipalBalance, company)],
    ["Interes pendiente", formatCurrency(metrics.activeInterestBalance, company)],
    ["Cuotas esperadas", formatCurrency(metrics.expectedToday, company)],
    ["Capital recuperado", formatCurrency(metrics.principalCollectedToday, company)],
    ["Ganancia recaudada", formatCurrency(metrics.interestCollectedToday + metrics.lateFeeCollectedToday, company)],
    ["Prestamos entregados", formatCurrency(-metrics.loanDisbursementsToday, company)],
    ["Caja reportada", formatCurrency(metrics.cashboxReportedToday, company)],
    ["Diferencia de caja", formatCurrency(metrics.cashboxDifferenceToday, company)],
    ["Entradas de caja", formatCurrency(metrics.cashInflowsToday, company)],
    ["Salidas de caja", formatCurrency(-metrics.cashOutflowsToday, company)],
    ["Movimiento neto", formatCurrency(cashNetToday, company)],
    ["Listos para renovar", String(metrics.renewalCandidates)],
    ["Cajas abiertas", String(metrics.openCashboxesToday)],
    ["Cajas descuadradas", String(metrics.unbalancedCashboxesToday)],
    ["Pendientes por recaudo", String(metrics.pendingClients)],
    ["Cobradores en ruta", String(metrics.activeSellers)]
  ];

  return (
    <AppShell title="Dashboard administrador" subtitle="Vista ejecutiva de prestamos, recaudos, caja y alertas de hoy.">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-white/10 bg-carbon-900 p-3 sm:p-4">
        <p className="text-sm text-zinc-400">Indicadores separados por cartera y moneda.</p>
        <CountryScopeForm countryCode={countryCode} />
      </div>
      <section className="overflow-hidden rounded-[1.75rem] border border-[#e9dfd2] bg-[#f2ece3] text-[#211d18] shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#211d18] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#f2ece3]">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                Resumen operativo
              </span>
              <span className="text-xs font-medium text-[#71685f]">Corte de hoy</span>
            </div>
            <p className="mt-8 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#71685f]">Cartera activa</p>
            <p className="mt-1 text-4xl font-black leading-none tracking-[-0.07em] tabular-nums sm:text-5xl">{formatCurrency(metrics.activeLoanBalance, company)}</p>
            <div className="mt-7 grid max-w-xl grid-cols-2 border-t border-[#d8cbbb] pt-4">
              <div>
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#71685f]">Capital en calle</p>
                <p className="mt-1 text-base font-bold tabular-nums">{formatCurrency(metrics.activePrincipalBalance, company)}</p>
              </div>
              <div className="border-l border-[#d8cbbb] pl-4">
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#71685f]">Interes pendiente</p>
                <p className="mt-1 text-base font-bold tabular-nums">{formatCurrency(metrics.activeInterestBalance, company)}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-[#d8cbbb] bg-[#e9e1d6] p-5 lg:border-l lg:border-t-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#71685f]">Recaudo de hoy</p>
                <p className="mt-1 text-2xl font-black tracking-[-0.05em] tabular-nums">{formatCurrency(metrics.collectedToday, company)}</p>
              </div>
              <span className="rounded-full border border-[#cfc3b4] px-2.5 py-1 text-[0.65rem] font-bold text-[#62594f]">{Math.round(collectionProgress)}%</span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#d4c9bc]">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${collectionProgress}%` }} />
            </div>
            <p className="mt-2 text-xs text-[#71685f]">de {formatCurrency(metrics.expectedToday, company)} esperados</p>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#d8cbbb] pt-4">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#71685f]">Vencidos</p>
                <p className={`mt-1 text-xl font-bold tabular-nums ${metrics.overdueLoans > 0 ? "text-[#a53d2d]" : "text-[#211d18]"}`}>{metrics.overdueLoans}</p>
              </div>
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#71685f]">En ruta</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{metrics.activeSellers}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Card className="mt-5">
        <CardHeader title="Indicadores del dia" description="Detalle de cartera, actividad y caja." />
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
          {additionalMetrics.map(([label, value]) => (
            <div key={label} className="min-w-0 border-l border-white/10 pl-3">
              <p className="truncate text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</p>
              <p className="mt-1 truncate text-sm font-semibold tabular-nums text-zinc-100 sm:text-base">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6">
        <AdminAnalytics company={company} data={analytics} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Rendimiento por cobrador" description="Recuperacion, caja y diferencias del dia." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-zinc-400">
              <tr>
                <th className="pb-3">Cobrador</th>
                <th className="pb-3 text-right">Esperado</th>
                <th className="pb-3 text-right">Recaudo</th>
                <th className="pb-3 text-right">%</th>
                <th className="pb-3 text-right">Prestado</th>
                <th className="pb-3 text-right">Caja esperada</th>
                <th className="pb-3 text-right">Reportada</th>
                <th className="pb-3 text-right">Diferencia</th>
                <th className="pb-3 text-right">Clientes</th>
                <th className="pb-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {collectorPerformance.map((collector) => (
                <tr key={collector.id}>
                  <td className="py-3 font-semibold">{collector.name}</td>
                  <td className="py-3 text-right">{formatCurrency(collector.expected, company)}</td>
                  <td className="py-3 text-right font-semibold text-emerald-300">{formatCurrency(collector.collected, company)}</td>
                  <td className="py-3 text-right font-black">{collector.recoveryRate}%</td>
                  <td className="py-3 text-right text-red-300">{formatCurrency(-collector.delivered, company)}</td>
                  <td className={collector.expectedCash < 0 ? "py-3 text-right text-red-300" : "py-3 text-right text-emerald-300"}>{formatCurrency(collector.expectedCash, company)}</td>
                  <td className={collector.reportedCash < 0 ? "py-3 text-right text-red-300" : "py-3 text-right"}>{formatCurrency(collector.reportedCash, company)}</td>
                  <td className={collector.difference === 0 ? "py-3 text-right text-emerald-300" : "py-3 text-right text-red-300"}>{formatCurrency(collector.difference, company)}</td>
                  <td className="py-3 text-right">{collector.visitedClients}</td>
                  <td className="py-3">
                    <StatusBadge tone={collector.unbalancedCashboxes > 0 ? "red" : collector.openCashboxes > 0 ? "orange" : "green"}>
                      {collector.unbalancedCashboxes > 0 ? "Descuadre" : collector.openCashboxes > 0 ? "Abierta" : "Ok"}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Cajas por cobrador" description="Estado operativo del dia." />
          <div className="space-y-3">
            {cashboxRows.map((row) => (
              <div key={row.id} className="rounded-xl bg-carbon-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{row.sellerName}</p>
                    <p className="mt-1 text-xs text-zinc-500">Inicial {formatCurrency(row.initialCash, company)}</p>
                  </div>
                  <StatusBadge tone={cashboxTone(row.status, row.difference)}>
                    {cashboxLabel(row.status)}
                  </StatusBadge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Mini label="Esperada" value={formatCurrency(row.expectedCash, company)} />
                  <Mini label="Reportada" value={formatCurrency(row.reportedCash, company)} />
                  <Mini label="Diferencia" value={formatCurrency(row.difference, company)} tone={row.difference === 0 ? "green" : "red"} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Cartera vencida" description="Clientes que requieren seguimiento." />
          <div className="space-y-3">
            {overdueLoanRows.length > 0 ? overdueLoanRows.map((loan) => (
              <Link key={loan.id} href={`/clients/${loan.clientId}`} className="block rounded-xl bg-carbon-950 p-4 transition hover:bg-carbon-850">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{loan.clientName}</p>
                    <p className="mt-1 text-xs text-zinc-500">{loan.sellerName} - vence {new Date(loan.dueDate).toLocaleDateString(company.locale)}</p>
                  </div>
                  <p className="shrink-0 font-black text-red-300">{formatCurrency(loan.balance, company)}</p>
                </div>
              </Link>
            )) : (
              <p className="rounded-xl bg-carbon-950 p-4 text-sm text-zinc-400">No hay prestamos vencidos activos.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Renovaciones cercanas" description="Clientes casi listos para nuevo prestamo." />
          <div className="space-y-3">
            {renewalCandidateRows.length > 0 ? renewalCandidateRows.map((loan) => (
              <Link key={loan.id} href={`/clients/${loan.clientId}#cobrar`} className="block rounded-xl bg-carbon-950 p-4 transition hover:bg-carbon-850">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{loan.clientName}</p>
                    <p className="mt-1 text-xs text-zinc-500">{loan.sellerName} - avance {loan.progress}%</p>
                  </div>
                  <p className="shrink-0 font-black text-orange-300">{formatCurrency(loan.balance, company)}</p>
                </div>
              </Link>
            )) : (
              <p className="rounded-xl bg-carbon-950 p-4 text-sm text-zinc-400">Aun no hay prestamos cercanos a renovar.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <CardHeader title="Alertas" description="Eventos que requieren atencion." />
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-xl border border-white/10 bg-carbon-950 p-4">
                <StatusBadge tone={notification.severity === "critical" ? "red" : notification.severity === "warning" ? "orange" : "green"}>
                  {notification.severity === "info" ? "Informativo" : "Revision"}
                </StatusBadge>
                <p className="mt-3 font-bold">{notification.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{notification.message}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Ultimos movimientos" description="Prestamos, recaudos, ingresos extra y movimientos de caja recientes." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-zinc-400">
                <tr>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Cobrador</th>
                  <th className="pb-3">Metodo</th>
                  <th className="pb-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentMovements.map((movement) => (
                  <tr key={`${movement.type}-${movement.id}`}>
                    <td className="py-3"><StatusBadge tone={movementTone(movement.type)}>{movement.type}</StatusBadge></td>
                    <td>{"clientName" in movement ? movement.clientName ?? "-" : "-"}</td>
                    <td>{"sellerName" in movement ? movement.sellerName ?? "-" : "-"}</td>
                    <td>{"paymentMethod" in movement && movement.paymentMethod ? paymentMethodLabel(movement.paymentMethod, company.countryCode) : "-"}</td>
                    <td className={movement.amount < 0 ? "text-right font-semibold text-red-300" : "text-right font-semibold"}>{formatCurrency(movement.amount, company)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function movementTone(type: string): "green" | "red" | "orange" | "gray" | "blue" {
  if (type === "Prestamo") return "orange";
  if (type === "Recaudo") return "blue";
  if (type === "Gasto" || type === "Retiro") return "red";
  return "green";
}

function Mini({ label, tone = "neutral", value }: { label: string; tone?: "neutral" | "green" | "red"; value: string }) {
  const toneClass = tone === "green" ? "text-emerald-300" : tone === "red" ? "text-red-300" : "text-white";

  return (
    <div className="rounded-lg bg-carbon-950/45 p-2">
      <p className="truncate text-[0.65rem] text-zinc-500">{label}</p>
      <p className={`mt-1 truncate font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function cashboxLabel(status: string) {
  if (status === "NOT_OPEN") return "Sin abrir";
  if (status === "OPEN") return "Abierta";
  if (status === "BALANCED" || status === "CLOSED") return "Cerrada";
  if (status === "UNBALANCED") return "Descuadre";
  return "Revision";
}

function cashboxTone(status: string, difference: number): "green" | "red" | "orange" | "gray" | "blue" {
  if (status === "NOT_OPEN") return "gray";
  if (status === "OPEN") return "orange";
  if (status === "UNBALANCED" || Math.abs(difference) > 0.009) return "red";
  return "green";
}
