import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button, LinkButton } from "@/components/ui/button";
import { ReportActions } from "@/components/reports/report-actions";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";
import { getPaymentMethodsForCountry } from "@/lib/payment-methods";
import { getReportsPageData, type ReportFilters } from "@/lib/reports-data";
import { generateWhatsAppReport } from "@/lib/reports";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<ReportFilters> }) {
  const filterInput = await searchParams;
  const data = await getReportsPageData(filterInput);
  if (!data) redirect("/login");

  const { cashbox, clients, collections, company, currentUser, expenses, filters, loans, routes, sales, users } = data;
  const reportingAllCollectors = currentUser.role !== "SELLER" && !filters.sellerId;
  const seller = reportingAllCollectors
    ? { ...currentUser, name: "Todos los cobradores" }
    : users.find((user) => user.id === cashbox.sellerId) ?? currentUser;
  const dateLabel = filters.from === filters.to ? undefined : `${formatInputDateLabel(filters.from)} - ${formatInputDateLabel(filters.to)}`;
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
    dateLabel,
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
          <ReportActions report={report} whatsappHref={whatsappHref} filenameBase={`rutero-reporte-${filters.from}-${filters.to}`} />
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader title="Filtros administrativos" />
            <form className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha inicial">
                <Input type="date" name="from" defaultValue={filters.from} />
              </Field>
              <Field label="Fecha final">
                <Input type="date" name="to" defaultValue={filters.to} />
              </Field>
              <Field label="Cobrador">
                <Select name="sellerId" defaultValue={filters.sellerId ?? "all"}>
                  {currentUser.role !== "SELLER" ? <option value="all">Todos los cobradores</option> : null}
                  {usersForSelect.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Ruta">
                <Select name="routeId" defaultValue={filters.routeId ?? "all"}>
                  <option value="all">Todas las rutas</option>
                  {routes.length > 0 ? (
                    routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))
                  ) : null}
                </Select>
              </Field>
              <Field label="Cliente">
                <Select name="clientId" defaultValue={filters.clientId ?? "all"}>
                  <option value="all">Todos los clientes</option>
                  {clients.length > 0 ? (
                    clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))
                  ) : null}
                </Select>
              </Field>
              <Field label="Metodo de pago">
                <Select name="paymentMethod" defaultValue={filters.paymentMethod ?? "all"}>
                  <option value="all">Todos</option>
                  {paymentMethods.map((method) => (
                    <option key={method.code} value={method.code}>
                      {paymentMethodLabel(method.code, company.countryCode)}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                <Button type="submit">Aplicar filtros</Button>
                <LinkButton href="/reports" variant="secondary">
                  Limpiar filtros
                </LinkButton>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader title="Resumen administrativo" />
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryItem label="Prestamos entregados" value={formatCurrency(-summary.loanDisbursementsTotal, company)} />
              <SummaryItem label="Ventas" value={formatCurrency(summary.salesTotal, company)} />
              <SummaryItem label="Recaudos" value={formatCurrency(summary.collectionsTotal, company)} />
              <SummaryItem label="Gastos descontados" value={formatCurrency(-summary.expensesTotal, company)} />
              <SummaryItem label="Retiros descontados" value={formatCurrency(-summary.withdrawalsTotal, company)} />
              <SummaryItem label="Entradas manuales" value={formatCurrency(summary.incomeMovementsTotal, company)} />
              <SummaryItem label="Caja fisica esperada" value={formatCurrency(summary.expectedCash, company)} />
              <SummaryItem label="Efectivo final reportado" value={formatCurrency(cashbox.reportedCash, company)} />
              <SummaryItem label="Diferencia fisica" value={formatCurrency(summary.difference, company)} />
              <SummaryItem label="Estado de caja" value={summary.statusMessage} />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function formatInputDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
