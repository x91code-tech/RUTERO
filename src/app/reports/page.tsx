import { Copy, Download, FileSpreadsheet, MessageCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";
import { getPaymentMethodsForCountry } from "@/lib/payment-methods";
import { getReportsPageData } from "@/lib/reports-data";
import { generateWhatsAppReport } from "@/lib/reports";

export default async function ReportsPage() {
  const data = await getReportsPageData();
  if (!data) redirect("/login");

  const { cashbox, clients, collections, company, currentUser, expenses, loans, routes, sales, users } = data;
  const seller = users.find((user) => user.id === cashbox.sellerId) ?? currentUser;
  const today = new Date().toISOString().slice(0, 10);
  const visitedClients = new Set([
    ...collections.map((collection) => collection.clientId),
    ...loans.map((loan) => loan.clientId),
    ...sales.map((sale) => sale.clientId)
  ]).size;
  const summary = calculateDailySummary({
    cashbox,
    sales,
    collections,
    expenses,
    loans,
    countryCode: company.countryCode
  });
  const report = generateWhatsAppReport({
    seller,
    cashbox,
    summary,
    sales,
    collections,
    expenses,
    loans,
    visitedClients,
    currencyConfig: company
  });
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(report)}`;
  const usersForSelect = users.length > 0 ? users : [currentUser];
  const paymentMethods = getPaymentMethodsForCountry(company.countryCode);

  return (
    <AppShell title="Reportes" subtitle="Reportes diarios y administrativos con datos reales de tu empresa.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Reporte diario para WhatsApp" description="Formato listo para revisar y enviar." />
          <pre className="max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-carbon-950 p-5 text-sm leading-6 text-zinc-200">{report}</pre>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button type="button">
              <Copy className="h-4 w-4" /> Copiar reporte
            </Button>
            <LinkButton href={whatsappHref} target="_blank" rel="noreferrer" variant="secondary">
              <MessageCircle className="h-4 w-4" /> Compartir por WhatsApp
            </LinkButton>
            <Button type="button" variant="secondary">
              <Download className="h-4 w-4" /> Descargar PDF
            </Button>
            <Button type="button" variant="secondary">
              <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
            </Button>
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader title="Filtros administrativos" />
            <form className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha inicial">
                <Input type="date" defaultValue={today} />
              </Field>
              <Field label="Fecha final">
                <Input type="date" defaultValue={today} />
              </Field>
              <Field label="Vendedor">
                <Select defaultValue={seller.id}>
                  {usersForSelect.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Ruta">
                <Select defaultValue={routes[0]?.id ?? ""}>
                  {routes.length > 0 ? (
                    routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Sin rutas</option>
                  )}
                </Select>
              </Field>
              <Field label="Cliente">
                <Select defaultValue={clients[0]?.id ?? ""}>
                  {clients.length > 0 ? (
                    clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Sin clientes</option>
                  )}
                </Select>
              </Field>
              <Field label="Metodo de pago">
                <Select defaultValue="all">
                  <option value="all">Todos</option>
                  {paymentMethods.map((method) => (
                    <option key={method.code} value={method.code}>
                      {paymentMethodLabel(method.code, company.countryCode)}
                    </option>
                  ))}
                </Select>
              </Field>
            </form>
          </Card>

          <Card>
            <CardHeader title="Resumen administrativo" />
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryItem label="Prestamos entregados" value={formatCurrency(summary.loanDisbursementsTotal, company)} />
              <SummaryItem label="Ventas" value={formatCurrency(summary.salesTotal, company)} />
              <SummaryItem label="Recaudos" value={formatCurrency(summary.collectionsTotal, company)} />
              <SummaryItem label="Gastos" value={formatCurrency(summary.expensesTotal, company)} />
              <SummaryItem label="Caja esperada" value={formatCurrency(summary.expectedCash, company)} />
              <SummaryItem label="Total reportado" value={formatCurrency(summary.reportedTotal, company)} />
              <SummaryItem label="Diferencia" value={formatCurrency(summary.difference, company)} />
              <SummaryItem label="Estado de caja" value={summary.statusMessage} />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
