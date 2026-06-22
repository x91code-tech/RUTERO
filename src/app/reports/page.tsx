import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button, LinkButton } from "@/components/ui/button";
import { ReportActions } from "@/components/reports/report-actions";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";
import { getPaymentMethodsForCountry } from "@/lib/payment-methods";
import { getReportsPageData, type ReportFilters } from "@/lib/reports-data";
import { generateWhatsAppReport } from "@/lib/reports";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<ReportFilters> }) {
  const filterInput = await searchParams;
  const data = await getReportsPageData(filterInput);
  if (!data) redirect("/login");

  const { cashbox, cashboxes, clients, collections, company, currentUser, expenses, filters, loans, routes, sales, users } = data;
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
  const collectionBreakdown = {
    principalApplied: sum(collections.map((collection) => collection.principalApplied)),
    interestApplied: sum(collections.map((collection) => collection.interestApplied)),
    lateFeeApplied: sum(collections.map((collection) => collection.lateFeeApplied)),
    additionalApplied: sum(collections.map((collection) => collection.additionalApplied)),
    overpaymentAmount: sum(collections.map((collection) => collection.overpaymentAmount)),
    installmentsCovered: sum(collections.map((collection) => collection.installmentsCovered))
  };
  const cashboxAudit = {
    open: cashboxes.filter((item) => item.status === "OPEN").length,
    closed: cashboxes.filter((item) => item.closedAt).length,
    unbalanced: cashboxes.filter((item) => item.status === "UNBALANCED" || Math.abs(item.difference) > 0.009).length
  };
  const clientBalanceTotal = sum(clients.map((client) => client.pendingBalance));
  const carryForwardNextDay = cashboxes.length > 0
    ? sum(cashboxes.map((item) => (item.closedAt ? item.reportedCash : item.expectedCash)))
    : summary.expectedCash;
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
    currencyConfig: company,
    carryForwardNextDay,
    collectionBreakdown,
    clientBalanceTotal,
    cashboxAudit
  });
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(report)}`;
  const usersForSelect = users.length > 0 ? users : [currentUser];
  const paymentMethods = getPaymentMethodsForCountry(company.countryCode);

  return (
    <AppShell title="Reportes" subtitle="Reportes diarios y administrativos con datos reales de tu empresa.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Reporte visual de caja" description="Resumen grafico listo para revisar antes de compartir." />
          <VisualCashReport
            cashbox={cashbox}
            company={company}
            collectionsCount={collections.length}
            dateLabel={dateLabel ?? formatInputDateLabel(filters.from)}
            expensesCount={expenses.length}
            cashboxAudit={cashboxAudit}
            carryForwardNextDay={carryForwardNextDay}
            clientBalanceTotal={clientBalanceTotal}
            collectionBreakdown={collectionBreakdown}
            loansCount={loans.length}
            salesCount={sales.length}
            sellerName={seller.name}
            summary={summary}
            visitedClients={visitedClients}
          />
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
              <SummaryItem label="Ingresos extra" value={formatCurrency(summary.salesTotal, company)} />
              <SummaryItem label="Recaudos" value={formatCurrency(summary.collectionsTotal, company)} />
              <SummaryItem label="Gastos descontados" value={formatCurrency(-summary.expensesTotal, company)} />
              <SummaryItem label="Retiros descontados" value={formatCurrency(-summary.withdrawalsTotal, company)} />
              <SummaryItem label="Entradas manuales" value={formatCurrency(summary.incomeMovementsTotal, company)} />
              <SummaryItem label="Caja fisica esperada" value={formatCurrency(summary.expectedCash, company)} />
              <SummaryItem label="Efectivo final reportado" value={formatCurrency(cashbox.reportedCash, company)} />
              <SummaryItem label="Arrastre proximo dia" value={formatCurrency(carryForwardNextDay, company)} />
              <SummaryItem label="Saldo pendiente clientes" value={formatCurrency(clientBalanceTotal, company)} />
              <SummaryItem label="Capital recuperado" value={formatCurrency(collectionBreakdown.principalApplied, company)} />
              <SummaryItem label="Interes recuperado" value={formatCurrency(collectionBreakdown.interestApplied, company)} />
              <SummaryItem label="Diferencia fisica" value={formatCurrency(summary.difference, company)} />
              <SummaryItem label="Estado de caja" value={summary.statusMessage} />
              <SummaryItem label="Cajas abiertas" value={String(cashboxAudit.open)} />
              <SummaryItem label="Cajas cerradas" value={String(cashboxAudit.closed)} />
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

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function VisualCashReport({
  cashbox,
  cashboxAudit,
  carryForwardNextDay,
  clientBalanceTotal,
  collectionBreakdown,
  collectionsCount,
  company,
  dateLabel,
  expensesCount,
  loansCount,
  salesCount,
  sellerName,
  summary,
  visitedClients
}: {
  cashbox: { initialCash: number; reportedCash: number };
  cashboxAudit: { open: number; closed: number; unbalanced: number };
  carryForwardNextDay: number;
  clientBalanceTotal: number;
  collectionBreakdown: {
    principalApplied: number;
    interestApplied: number;
    lateFeeApplied: number;
    additionalApplied: number;
    overpaymentAmount: number;
    installmentsCovered: number;
  };
  collectionsCount: number;
  company: Parameters<typeof formatCurrency>[1];
  dateLabel: string;
  expensesCount: number;
  loansCount: number;
  salesCount: number;
  sellerName: string;
  summary: ReturnType<typeof calculateDailySummary>;
  visitedClients: number;
}) {
  const inflowRows = [
    { label: "Ingresos extra efectivo", value: summary.cashSales },
    { label: "Recaudos efectivo", value: summary.cashCollections },
    { label: "Entradas manuales", value: summary.cashIncomeMovements }
  ];
  const outflowRows = [
    { label: "Prestamos entregados", value: summary.loanDisbursementsTotal },
    { label: "Gastos", value: summary.cashExpenses },
    { label: "Retiros", value: summary.cashWithdrawals }
  ];
  const digitalRows = [
    { label: "Digital / wallets", value: summary.pixTotal },
    { label: "Transferencias / tarjetas", value: summary.transferTotal }
  ];

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">Cierre de ruta</p>
            <h2 className="mt-1 text-2xl font-black">{sellerName}</h2>
            <p className="text-sm text-zinc-500">{dateLabel}</p>
          </div>
          <StatusBadge tone={summary.difference === 0 ? "green" : "orange"}>{summary.statusMessage}</StatusBadge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ReportNumber label="Caja inicial" value={formatCurrency(cashbox.initialCash, company)} />
          <ReportNumber label="Caja esperada" value={formatCurrency(summary.expectedCash, company)} tone={summary.expectedCash < 0 ? "red" : "green"} />
          <ReportNumber label="Diferencia" value={formatCurrency(summary.difference, company)} tone={summary.difference === 0 ? "green" : "red"} />
          <ReportNumber label="Arrastre manana" value={formatCurrency(carryForwardNextDay, company)} tone={carryForwardNextDay < 0 ? "red" : "green"} />
          <ReportNumber label="Cajas abiertas" value={String(cashboxAudit.open)} tone={cashboxAudit.open > 0 ? "red" : "green"} />
          <ReportNumber label="Cajas cerradas" value={String(cashboxAudit.closed)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Entradas de efectivo" total={summary.cashInflows} rows={inflowRows} company={company} tone="green" />
        <ChartPanel title="Salidas de efectivo" total={summary.cashOutflows} rows={outflowRows} company={company} tone="red" />
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">Caja fisica</p>
            <p className="text-xl font-black">{formatCurrency(summary.expectedCash, company)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-zinc-400">Efectivo reportado</p>
            <p className="text-xl font-black">{formatCurrency(cashbox.reportedCash, company)}</p>
          </div>
        </div>
        <BalanceBar difference={summary.difference} expectedCash={summary.expectedCash} reportedCash={cashbox.reportedCash} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          title="Aplicacion de recaudos"
          total={summary.collectionsTotal}
          rows={[
            { label: "Capital recuperado", value: collectionBreakdown.principalApplied },
            { label: "Interes recuperado", value: collectionBreakdown.interestApplied },
            { label: "Mora recuperada", value: collectionBreakdown.lateFeeApplied },
            { label: "Adicionales", value: collectionBreakdown.additionalApplied },
            { label: "Sobrantes / adelantos", value: collectionBreakdown.overpaymentAmount }
          ]}
          company={company}
          tone="green"
        />
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="font-black">Cartera y control</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ReportNumber label="Saldo pendiente" value={formatCurrency(clientBalanceTotal, company)} tone={clientBalanceTotal > 0 ? "red" : "green"} />
            <ReportNumber label="Cuotas cubiertas" value={String(collectionBreakdown.installmentsCovered)} />
            <ReportNumber label="Cajas descuadradas" value={String(cashboxAudit.unbalanced)} tone={cashboxAudit.unbalanced > 0 ? "red" : "green"} />
            <ReportNumber label="Movimiento neto" value={formatCurrency(summary.expectedCash - cashbox.initialCash, company)} tone={summary.expectedCash - cashbox.initialCash < 0 ? "red" : "green"} />
          </div>
        </div>
      </div>

      <ChartPanel title="Dinero digital declarado" total={summary.digitalTotal} rows={digitalRows} company={company} tone="orange" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReportNumber label="Clientes visitados" value={String(visitedClients)} />
        <ReportNumber label="Prestamos creados" value={String(loansCount)} />
        <ReportNumber label="Recaudos" value={String(collectionsCount)} />
        <ReportNumber label="Movimientos de caja" value={String(expensesCount)} />
        <ReportNumber label="Ingresos extra" value={String(salesCount)} />
      </div>
    </div>
  );
}

function ChartPanel({
  company,
  rows,
  title,
  tone,
  total
}: {
  company: Parameters<typeof formatCurrency>[1];
  rows: { label: string; value: number }[];
  title: string;
  tone: "green" | "orange" | "red";
  total: number;
}) {
  const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1);
  const color = tone === "green" ? "bg-emerald-400" : tone === "red" ? "bg-red-400" : "bg-brand-500";

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-black">{title}</p>
        <p className={tone === "red" ? "font-black text-red-300" : tone === "green" ? "font-black text-emerald-300" : "font-black text-orange-300"}>
          {formatCurrency(total, company)}
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="truncate text-zinc-300">{row.label}</span>
              <span className="font-semibold text-white">{formatCurrency(row.value, company)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${(Math.abs(row.value) / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BalanceBar({ difference, expectedCash, reportedCash }: { difference: number; expectedCash: number; reportedCash: number }) {
  const max = Math.max(Math.abs(expectedCash), Math.abs(reportedCash), Math.abs(difference), 1);
  const expectedWidth = (Math.abs(expectedCash) / max) * 100;
  const reportedWidth = (Math.abs(reportedCash) / max) * 100;

  return (
    <div className="mt-4 grid gap-3">
      <BalanceRow label="Esperado" value={expectedCash} width={expectedWidth} />
      <BalanceRow label="Reportado" value={reportedCash} width={reportedWidth} />
    </div>
  );
}

function BalanceRow({ label, value, width }: { label: string; value: number; width: number }) {
  const color = value < 0 ? "bg-red-400" : "bg-emerald-400";

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className={value < 0 ? "font-semibold text-red-300" : "font-semibold text-emerald-300"}>{value < 0 ? "Negativo" : "Positivo"}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ReportNumber({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "green" | "red" }) {
  return (
    <div className="rounded-xl bg-carbon-950/60 p-3">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className={tone === "red" ? "mt-2 text-xl font-black text-red-300" : tone === "green" ? "mt-2 text-xl font-black text-emerald-300" : "mt-2 text-xl font-black text-white"}>{value}</p>
    </div>
  );
}
