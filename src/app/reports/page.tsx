import { Download, FileSpreadsheet, MessageCircle, Copy } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { demoCashbox, demoClients, demoCollections, demoCompany, demoExpenses, demoRoutes, demoSales, demoUsers } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/formatters";
import { generateWhatsAppReport } from "@/lib/reports";

export default function ReportsPage() {
  const seller = demoUsers.find((user) => user.id === demoCashbox.sellerId)!;
  const summary = calculateDailySummary({ cashbox: demoCashbox, sales: demoSales, collections: demoCollections, expenses: demoExpenses });
  const report = generateWhatsAppReport({ seller, cashbox: demoCashbox, summary, sales: demoSales, collections: demoCollections, expenses: demoExpenses, visitedClients: 8, currencyConfig: demoCompany });

  return (
    <AppShell title="Reportes" subtitle="Reportes diarios y administrativos filtrables por fecha, vendedor, cliente, ruta y método.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Reporte diario para WhatsApp" description="Formato listo para copiar y enviar." />
          <pre className="max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-carbon-950 p-5 text-sm leading-6 text-zinc-200">{report}</pre>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button type="button"><Copy className="h-4 w-4" /> Copiar reporte</Button>
            <Button type="button" variant="secondary"><MessageCircle className="h-4 w-4" /> Compartir por WhatsApp</Button>
            <Button type="button" variant="secondary"><Download className="h-4 w-4" /> Descargar PDF</Button>
            <Button type="button" variant="secondary"><FileSpreadsheet className="h-4 w-4" /> Exportar Excel</Button>
          </div>
        </Card>
        <div className="grid gap-6">
          <Card>
            <CardHeader title="Filtros administrativos" />
            <form className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha inicial"><Input type="date" defaultValue="2026-06-01" /></Field>
              <Field label="Fecha final"><Input type="date" defaultValue="2026-06-12" /></Field>
              <Field label="Vendedor"><Select>{demoUsers.map((user) => <option key={user.id}>{user.name}</option>)}</Select></Field>
              <Field label="Ruta"><Select>{demoRoutes.map((route) => <option key={route.id}>{route.name}</option>)}</Select></Field>
              <Field label="Cliente"><Select>{demoClients.map((client) => <option key={client.id}>{client.name}</option>)}</Select></Field>
              <Field label="Método de pago"><Select><option>Todos</option><option>Efectivo</option><option>Transferencia</option><option>Pix</option><option>Crédito</option></Select></Field>
            </form>
          </Card>
          <Card>
            <CardHeader title="Resumen administrativo" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/[0.04] p-4"><p className="text-sm text-zinc-400">Ventas</p><p className="text-xl font-black">{formatCurrency(summary.salesTotal, demoCompany)}</p></div>
              <div className="rounded-xl bg-white/[0.04] p-4"><p className="text-sm text-zinc-400">Recaudos</p><p className="text-xl font-black">{formatCurrency(summary.collectionsTotal, demoCompany)}</p></div>
              <div className="rounded-xl bg-white/[0.04] p-4"><p className="text-sm text-zinc-400">Gastos</p><p className="text-xl font-black">{formatCurrency(summary.expensesTotal, demoCompany)}</p></div>
              <div className="rounded-xl bg-white/[0.04] p-4"><p className="text-sm text-zinc-400">Estado de caja</p><p className="text-xl font-black">{summary.statusMessage}</p></div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
