import Link from "next/link";
import { AlertTriangle, Banknote, Gauge, Landmark, RefreshCw, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/cards/metric-card";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminAnalytics } from "@/components/charts/admin-analytics";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default async function DashboardPage() {
  const { analytics, cashboxRows, collectorPerformance, company, metrics, notifications, overdueLoanRows, recentMovements, renewalCandidateRows } = await getDashboardData();
  const cashNetToday = metrics.cashInflowsToday - metrics.cashOutflowsToday;

  return (
    <AppShell title="Dashboard administrador" subtitle="Vista ejecutiva de prestamos, recaudos, caja y alertas de hoy.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Deuda activa" value={formatCurrency(metrics.activeLoanBalance, company)} icon={<Landmark />} />
        <MetricCard label="Capital en calle" value={formatCurrency(metrics.activePrincipalBalance, company)} icon={<Landmark />} />
        <MetricCard label="Interes pendiente" value={formatCurrency(metrics.activeInterestBalance, company)} icon={<TrendingUp />} tone="orange" />
        <MetricCard label="Cuotas esperadas hoy" value={formatCurrency(metrics.expectedToday, company)} icon={<Wallet />} />
        <MetricCard label="Cobrado hoy" value={formatCurrency(metrics.collectedToday, company)} icon={<Wallet />} tone="green" />
        <MetricCard label="Capital recuperado" value={formatCurrency(metrics.principalCollectedToday, company)} icon={<Wallet />} />
        <MetricCard label="Ganancia cobrada" value={formatCurrency(metrics.interestCollectedToday + metrics.lateFeeCollectedToday, company)} icon={<TrendingUp />} tone="green" />
        <MetricCard label="Prestamos entregados hoy" value={formatCurrency(-metrics.loanDisbursementsToday, company)} icon={<TrendingDown />} tone="red" />
        <MetricCard label="Caja esperada hoy" value={formatCurrency(metrics.cashboxExpectedToday, company)} icon={<Banknote />} tone={metrics.cashboxExpectedToday < 0 ? "red" : "green"} />
        <MetricCard label="Caja reportada" value={formatCurrency(metrics.cashboxReportedToday, company)} icon={<Banknote />} tone={metrics.cashboxReportedToday < 0 ? "red" : "green"} />
        <MetricCard label="Diferencia caja" value={formatCurrency(metrics.cashboxDifferenceToday, company)} icon={<Gauge />} tone={metrics.cashboxDifferenceToday === 0 ? "green" : "red"} />
        <MetricCard label="Entradas caja" value={formatCurrency(metrics.cashInflowsToday, company)} icon={<TrendingUp />} tone="green" />
        <MetricCard label="Salidas caja" value={formatCurrency(-metrics.cashOutflowsToday, company)} icon={<TrendingDown />} tone="orange" />
        <MetricCard label="Movimiento neto caja" value={formatCurrency(cashNetToday, company)} tone={cashNetToday >= 0 ? "green" : "red"} />
        <MetricCard label="Prestamos vencidos" value={String(metrics.overdueLoans)} icon={<AlertTriangle />} tone={metrics.overdueLoans > 0 ? "red" : "green"} />
        <MetricCard label="Listos para renovar" value={String(metrics.renewalCandidates)} icon={<RefreshCw />} tone={metrics.renewalCandidates > 0 ? "orange" : "green"} />
        <MetricCard label="Cajas abiertas" value={String(metrics.openCashboxesToday)} icon={<AlertTriangle />} tone={metrics.openCashboxesToday > 0 ? "orange" : "green"} />
        <MetricCard label="Cajas descuadradas" value={String(metrics.unbalancedCashboxesToday)} icon={<AlertTriangle />} tone={metrics.unbalancedCashboxesToday > 0 ? "red" : "green"} />
        <MetricCard label="Clientes pendientes" value={String(metrics.pendingClients)} tone={metrics.pendingClients > 0 ? "orange" : "green"} />
        <MetricCard label="Cobradores activos" value={String(metrics.activeSellers)} icon={<Users />} />
      </div>

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
                <th className="pb-3 text-right">Cobrado</th>
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
              <div key={row.id} className="rounded-xl bg-white/[0.04] p-4">
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
              <Link key={loan.id} href={`/clients/${loan.clientId}`} className="block rounded-xl bg-white/[0.04] p-4 transition hover:bg-white/[0.07]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{loan.clientName}</p>
                    <p className="mt-1 text-xs text-zinc-500">{loan.sellerName} - vence {new Date(loan.dueDate).toLocaleDateString(company.locale)}</p>
                  </div>
                  <p className="shrink-0 font-black text-red-300">{formatCurrency(loan.balance, company)}</p>
                </div>
              </Link>
            )) : (
              <p className="rounded-xl bg-white/[0.04] p-4 text-sm text-zinc-400">No hay prestamos vencidos activos.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Renovaciones cercanas" description="Clientes casi listos para nuevo prestamo." />
          <div className="space-y-3">
            {renewalCandidateRows.length > 0 ? renewalCandidateRows.map((loan) => (
              <Link key={loan.id} href={`/clients/${loan.clientId}#cobrar`} className="block rounded-xl bg-white/[0.04] p-4 transition hover:bg-white/[0.07]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{loan.clientName}</p>
                    <p className="mt-1 text-xs text-zinc-500">{loan.sellerName} - avance {loan.progress}%</p>
                  </div>
                  <p className="shrink-0 font-black text-orange-300">{formatCurrency(loan.balance, company)}</p>
                </div>
              </Link>
            )) : (
              <p className="rounded-xl bg-white/[0.04] p-4 text-sm text-zinc-400">Aun no hay prestamos cercanos a renovar.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <CardHeader title="Alertas" description="Eventos que requieren atencion." />
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
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
