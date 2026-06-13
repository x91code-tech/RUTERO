import { AlertTriangle, Banknote, MapPin, ReceiptText, Users, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/cards/metric-card";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { SimpleBars } from "@/components/charts/simple-bars";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { demoCashbox, demoClients, demoCollections, demoCompany, demoExpenses, demoNotifications, demoSales, demoUsers } from "@/lib/demo-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default function DashboardPage() {
  const summary = calculateDailySummary({ cashbox: demoCashbox, sales: demoSales, collections: demoCollections, expenses: demoExpenses });
  const activeSellers = demoUsers.filter((user) => user.role === "SELLER").length;
  const visitedClients = 8;
  const pendingClients = Math.max(demoClients.length - 2, 0);

  return (
    <AppShell title="Dashboard administrador" subtitle="Vista ejecutiva de ventas, recaudos, caja y alertas de hoy.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ventas de hoy" value={formatCurrency(summary.salesTotal, demoCompany)} icon={<ReceiptText />} />
        <MetricCard label="Recaudos de hoy" value={formatCurrency(summary.collectionsTotal, demoCompany)} icon={<Wallet />} />
        <MetricCard label="Gastos de hoy" value={formatCurrency(summary.expensesTotal, demoCompany)} icon={<Banknote />} tone="orange" />
        <MetricCard label="Diferencia" value={formatCurrency(summary.difference, demoCompany)} icon={<AlertTriangle />} tone={summary.difference === 0 ? "green" : "red"} />
        <MetricCard label="Caja esperada" value={formatCurrency(summary.expectedCash, demoCompany)} />
        <MetricCard label="Caja reportada" value={formatCurrency(demoCashbox.reportedCash, demoCompany)} />
        <MetricCard label="Vendedores activos" value={String(activeSellers)} icon={<Users />} />
        <MetricCard label="Clientes visitados" value={`${visitedClients}/${visitedClients + pendingClients}`} icon={<MapPin />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Ventas por día" description="Tendencia operativa de la semana." />
          <SimpleBars currencyConfig={demoCompany} data={[
            { label: "Lunes", value: 1880 },
            { label: "Martes", value: 2210 },
            { label: "Miércoles", value: 1940 },
            { label: "Jueves", value: 2620 },
            { label: "Viernes", value: summary.salesTotal }
          ]} />
        </Card>
        <Card>
          <CardHeader title="Recaudos por vendedor" description="Cobranza comparada del día." />
          <SimpleBars currencyConfig={demoCompany} data={[
            { label: "Vendedor Demo", value: 400 },
            { label: "Supervisora Norte", value: 1520 }
          ]} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader title="Últimos movimientos" description="Ventas, recaudos y gastos recientes." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-zinc-400">
                <tr>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Método</th>
                  <th className="pb-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {demoSales.map((sale) => {
                  const client = demoClients.find((item) => item.id === sale.clientId);
                  return (
                    <tr key={sale.id}>
                      <td className="py-3"><StatusBadge tone="green">Venta</StatusBadge></td>
                      <td>{client?.name}</td>
                      <td>{paymentMethodLabel(sale.paymentMethod)}</td>
                      <td className="text-right font-semibold">{formatCurrency(sale.amount, demoCompany)}</td>
                    </tr>
                  );
                })}
                {demoCollections.map((collection) => {
                  const client = demoClients.find((item) => item.id === collection.clientId);
                  return (
                    <tr key={collection.id}>
                      <td className="py-3"><StatusBadge tone="blue">Recaudo</StatusBadge></td>
                      <td>{client?.name}</td>
                      <td>{paymentMethodLabel(collection.paymentMethod)}</td>
                      <td className="text-right font-semibold">{formatCurrency(collection.amount, demoCompany)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="Alertas" description="Eventos que requieren atención." />
          <div className="space-y-3">
            {demoNotifications.map((notification) => (
              <div key={notification.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <StatusBadge tone={notification.severity === "critical" ? "red" : notification.severity === "warning" ? "orange" : "green"}>
                  {notification.severity === "info" ? "Informativo" : "Revisión"}
                </StatusBadge>
                <p className="mt-3 font-bold">{notification.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{notification.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
