import { AlertTriangle, Banknote, Landmark, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/cards/metric-card";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminAnalytics } from "@/components/charts/admin-analytics";
import { getDashboardData } from "@/lib/dashboard-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default async function DashboardPage() {
  const { analytics, company, metrics, notifications, recentMovements } = await getDashboardData();
  const cashNetToday = metrics.cashInflowsToday - metrics.cashOutflowsToday;

  return (
    <AppShell title="Dashboard administrador" subtitle="Vista ejecutiva de prestamos, recaudos, caja y alertas de hoy.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Deuda activa" value={formatCurrency(metrics.activeLoanBalance, company)} icon={<Landmark />} />
        <MetricCard label="Cuotas esperadas hoy" value={formatCurrency(metrics.expectedToday, company)} icon={<Wallet />} />
        <MetricCard label="Cobrado hoy" value={formatCurrency(metrics.collectedToday, company)} icon={<Wallet />} tone="green" />
        <MetricCard label="Prestamos entregados hoy" value={formatCurrency(-metrics.loanDisbursementsToday, company)} icon={<TrendingDown />} tone="red" />
        <MetricCard label="Caja esperada hoy" value={formatCurrency(metrics.cashboxExpectedToday, company)} icon={<Banknote />} tone={metrics.cashboxExpectedToday < 0 ? "red" : "green"} />
        <MetricCard label="Entradas caja" value={formatCurrency(metrics.cashInflowsToday, company)} icon={<TrendingUp />} tone="green" />
        <MetricCard label="Salidas caja" value={formatCurrency(-metrics.cashOutflowsToday, company)} icon={<TrendingDown />} tone="orange" />
        <MetricCard label="Movimiento neto caja" value={formatCurrency(cashNetToday, company)} tone={cashNetToday >= 0 ? "green" : "red"} />
        <MetricCard label="Prestamos vencidos" value={String(metrics.overdueLoans)} icon={<AlertTriangle />} tone={metrics.overdueLoans > 0 ? "red" : "green"} />
        <MetricCard label="Clientes pendientes" value={String(metrics.pendingClients)} tone={metrics.pendingClients > 0 ? "orange" : "green"} />
        <MetricCard label="Cobradores activos" value={String(metrics.activeSellers)} icon={<Users />} />
      </div>

      <div className="mt-6">
        <AdminAnalytics company={company} data={analytics} />
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
