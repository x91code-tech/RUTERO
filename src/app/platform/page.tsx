import Link from "next/link";
import { AlertTriangle, Building2, CalendarClock, HandCoins, Users, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PlatformAnalytics } from "@/components/platform/platform-analytics";
import { LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { formatBillingAmount, getBillingStatus } from "@/lib/billing";
import { formatShortDate } from "@/lib/formatters";
import { getPlatformDashboardData } from "@/lib/platform-data";

export default async function PlatformPage() {
  const { companies, partners, settings, summary } = await getPlatformDashboardData();
  const activePartners = partners.filter((partner) => partner.active);
  const analytics = buildPlatformAnalytics(companies, partners, settings.gracePeriodDays);
  const alerts = buildPlatformAlerts(companies, partners, settings.gracePeriodDays);

  return (
    <AppShell title="Plataforma" subtitle="Metricas, dinero, vencimientos y avisos importantes de RUTERO.">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Empresas cliente" value={summary.companies} icon={<Building2 className="h-5 w-5" />} />
        <SummaryCard label="Socios activos" value={activePartners.length} icon={<Users className="h-5 w-5" />} />
        <SummaryCard label="Por cobrar" value={summary.dueSoon + summary.partnerDueSoon} icon={<CalendarClock className="h-5 w-5" />} />
        <SummaryCard label="Suspendidas" value={summary.suspended + summary.partnerSuspended} icon={<HandCoins className="h-5 w-5" />} />
        <SummaryCard label="Sin plan" value={summary.needsSetup} icon={<WalletCards className="h-5 w-5" />} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <PlatformAnalytics {...analytics} />
        <div className="grid content-start gap-5">
          <Card>
            <CardHeader title="Dinero mensual" description="Ingresos configurados por moneda. No mezcla monedas." />
            <div className="grid gap-2">
              {analytics.currencyRows.length ? analytics.currencyRows.map((row) => (
                <div key={row.currencyCode} className="flex items-center justify-between rounded-xl border border-white/10 bg-carbon-950 px-4 py-3">
                  <span className="text-sm font-semibold text-zinc-300">{row.currencyCode}</span>
                  <strong className="tabular-nums text-white">{formatBillingAmount(row.value, row.currencyCode)}</strong>
                </div>
              )) : <p className="rounded-xl border border-white/10 bg-carbon-950 p-4 text-sm text-zinc-500">Todavia no hay mensualidades configuradas.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Acciones rapidas" description="Operaciones fuera del dashboard." />
            <div className="grid gap-2">
              <LinkButton href="/platform/companies/new">Nueva empresa</LinkButton>
              <LinkButton href="/platform/companies" variant="secondary">Administrar empresas</LinkButton>
              <LinkButton href="/platform/plans" variant="secondary">Modificar planes</LinkButton>
              <LinkButton href="/platform/partners" variant="secondary">Socios</LinkButton>
            </div>
          </Card>
        </div>
      </section>

      <Card className="mt-5">
        <CardHeader title="Avisos" description="Cuentas que necesitan accion del propietario." />
        <div className="grid gap-3 lg:grid-cols-2">
          {alerts.length ? alerts.map((alert) => (
            <Link key={`${alert.href}-${alert.title}`} href={alert.href} className="flex gap-3 rounded-xl border border-white/10 bg-carbon-950 p-4 transition hover:border-brand-500/40">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-300">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-white">{alert.title}</span>
                <span className="mt-1 block text-sm leading-5 text-zinc-400">{alert.description}</span>
              </span>
            </Link>
          )) : <p className="rounded-xl border border-white/10 bg-carbon-950 p-4 text-sm text-zinc-400">No hay avisos criticos por ahora.</p>}
        </div>
      </Card>
    </AppShell>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-carbon-900 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/10 text-brand-300">{icon}</span>
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums text-white">{value}</p>
      </div>
    </div>
  );
}

function buildPlatformAnalytics(
  companies: Awaited<ReturnType<typeof getPlatformDashboardData>>["companies"],
  partners: Awaited<ReturnType<typeof getPlatformDashboardData>>["partners"],
  gracePeriodDays: number
) {
  const statusMeta = {
    CURRENT: { label: "Al dia", color: "#ff7a1a" },
    DUE_SOON: { label: "Vence pronto", color: "#f59e0b" },
    GRACE: { label: "Gracia", color: "#fb923c" },
    SUSPENDED: { label: "Suspendidas", color: "#ef4444" },
    NO_DUE_DATE: { label: "Sin plan", color: "#78716c" }
  };
  const statusCounts = new Map(Object.keys(statusMeta).map((status) => [status, 0]));
  const planCounts = new Map<string, number>();
  const currencyTotals = new Map<string, number>();
  const partnerCounts = new Map<string, number>();

  for (const company of companies) {
    const subscription = company.subscription;
    const billingStatus = subscription ? getBillingStatus(subscription.renewsAt, subscription.active, gracePeriodDays) : "NO_DUE_DATE";
    statusCounts.set(billingStatus, (statusCounts.get(billingStatus) ?? 0) + 1);
    const planName = subscription?.name ?? "Sin plan";
    planCounts.set(planName, (planCounts.get(planName) ?? 0) + 1);
    if (subscription?.active) currencyTotals.set(subscription.billingCurrency, (currencyTotals.get(subscription.billingCurrency) ?? 0) + Number(subscription.billingAmount));
    const partnerName = company.referredByPartner?.user.name ?? "Venta directa";
    partnerCounts.set(partnerName, (partnerCounts.get(partnerName) ?? 0) + 1);
  }

  for (const partner of partners) {
    if (!partnerCounts.has(partner.user.name)) partnerCounts.set(partner.user.name, 0);
  }

  return {
    statusRows: Object.entries(statusMeta).map(([status, meta]) => ({ ...meta, value: statusCounts.get(status) ?? 0 })),
    planRows: Array.from(planCounts, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    currencyRows: Array.from(currencyTotals, ([currencyCode, value]) => ({ label: currencyCode, currencyCode, value })).sort((a, b) => b.value - a.value),
    partnerRows: Array.from(partnerCounts, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  };
}

function buildPlatformAlerts(
  companies: Awaited<ReturnType<typeof getPlatformDashboardData>>["companies"],
  partners: Awaited<ReturnType<typeof getPlatformDashboardData>>["partners"],
  gracePeriodDays: number
) {
  const alerts: { title: string; description: string; href: string }[] = [];
  for (const company of companies) {
    const subscription = company.subscription;
    const status = subscription ? getBillingStatus(subscription.renewsAt, subscription.active, gracePeriodDays) : "NO_DUE_DATE";
    if (status === "NO_DUE_DATE") alerts.push({ title: `${company.name} no tiene plan`, description: "Asigna plan, limites, precio y vencimiento.", href: "/platform/companies" });
    if (status === "DUE_SOON" || status === "GRACE") alerts.push({ title: `${company.name} esta por cobrar`, description: `Vence ${subscription?.renewsAt ? formatShortDate(subscription.renewsAt) : "sin fecha"}.`, href: "/platform/companies" });
    if (status === "SUSPENDED") alerts.push({ title: `${company.name} esta suspendida`, description: "Registra pago o actualiza el contrato para reactivar el acceso.", href: "/platform/companies" });
  }
  for (const partner of partners) {
    const subscription = partner.user.company.subscription;
    const status = subscription ? getBillingStatus(subscription.renewsAt, subscription.active, gracePeriodDays) : "NO_DUE_DATE";
    if (status === "DUE_SOON" || status === "GRACE" || status === "SUSPENDED") {
      alerts.push({ title: `Socio ${partner.user.name}`, description: `Estado comercial: ${status.toLowerCase()}.`, href: "/platform/partners" });
    }
  }
  return alerts.slice(0, 8);
}
