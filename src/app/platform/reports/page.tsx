import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { formatBillingAmount, getBillingStatus } from "@/lib/billing";
import { getPlatformDashboardData } from "@/lib/platform-data";

export default async function PlatformReportsPage() {
  const { companies, partners, settings } = await getPlatformDashboardData();
  const currencies = new Map<string, number>();
  let active = 0;
  let atRisk = 0;
  let suspended = 0;
  let withoutPlan = 0;

  for (const company of companies) {
    const subscription = company.subscription;
    if (!subscription) {
      withoutPlan += 1;
      continue;
    }
    const status = getBillingStatus(subscription.renewsAt, subscription.active, settings.gracePeriodDays);
    if (status === "CURRENT") active += 1;
    if (status === "DUE_SOON" || status === "GRACE") atRisk += 1;
    if (status === "SUSPENDED") suspended += 1;
    if (subscription.active) currencies.set(subscription.billingCurrency, (currencies.get(subscription.billingCurrency) ?? 0) + Number(subscription.billingAmount));
  }

  return (
    <AppShell title="Reportes globales" subtitle="Resumen ejecutivo de cuentas, cartera comercial y mensualidades.">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Empresas activas" value={String(active)} />
        <Metric label="Por cobrar" value={String(atRisk)} />
        <Metric label="Suspendidas" value={String(suspended)} />
        <Metric label="Sin plan" value={String(withoutPlan)} />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Mensualidad configurada" description="Suma separada por moneda." />
          <div className="grid gap-3">
            {Array.from(currencies, ([currencyCode, amount]) => (
              <Metric key={currencyCode} label={currencyCode} value={formatBillingAmount(amount, currencyCode)} />
            ))}
            {!currencies.size ? <p className="text-sm text-zinc-500">Sin mensualidades activas.</p> : null}
          </div>
        </Card>
        <Card>
          <CardHeader title="Socios" description="Capacidad comercial y referidos." />
          <div className="grid gap-3">
            {partners.map((partner) => (
              <div key={partner.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-carbon-950 px-4 py-3">
                <span className="min-w-0 truncate text-sm font-semibold text-zinc-300">{partner.user.name}</span>
                <strong className="text-sm text-white">{partner._count.referredCompanies}/{partner.maxCompanies}</strong>
              </div>
            ))}
            {!partners.length ? <p className="text-sm text-zinc-500">Sin socios registrados.</p> : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-carbon-900 p-4">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}
