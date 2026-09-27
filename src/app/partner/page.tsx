import { Building2, HandCoins } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { TenantCreateForm } from "@/components/platform/tenant-create-form";
import { Card, CardHeader } from "@/components/ui/card";
import { formatBillingAmount, getBillingStatus } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { getPartnerDashboardData } from "@/lib/platform-data";
import { formatShortDate } from "@/lib/formatters";
import { createReferredCompanyAction } from "@/server/actions/platform-actions";

const labels = {
  CURRENT: "Al día",
  DUE_SOON: "Vence pronto",
  GRACE: "En periodo de gracia",
  SUSPENDED: "Suspendida",
  NO_DUE_DATE: "Sin vencimiento"
};

export default async function PartnerPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const [{ profile, settings, commissions }, params] = await Promise.all([getPartnerDashboardData(), searchParams]);
  const plans = await prisma.platformPlan.findMany({
    where: { active: true, monthlyPrice: { gt: 0 }, type: { in: ["INDIVIDUAL", "BUSINESS"] } },
    orderBy: [{ type: "asc" }, { monthlyPrice: "asc" }]
  });
  const subscription = profile.user.company.subscription;
  const ownStatus = subscription
    ? getBillingStatus(subscription.renewsAt, subscription.active, settings.gracePeriodDays)
    : "NO_DUE_DATE";
  const pendingCommissions = groupCommissions(commissions.filter((item) => item.status === "PENDING"));
  const paidCommissions = groupCommissions(commissions.filter((item) => item.status === "PAID"));

  return (
    <AppShell title="Panel de socio" subtitle={`Empresas referidas y comisiones · ${profile.user.name}`}>
      {params.error ? <p role="status" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{partnerError(params.error)}</p> : null}
      {params.created ? <p role="status" className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Empresa registrada. Comparte las credenciales por un canal seguro.</p> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Empresas referidas" value={`${profile.referredCompanies.length} / ${profile.maxCompanies}`} icon={<Building2 className="h-5 w-5" />} />
        <Summary label="Tu plan mensual" value={subscription ? formatBillingAmount(Number(subscription.billingAmount), subscription.billingCurrency) : "Sin plan"} icon={<Building2 className="h-5 w-5" />} />
        <Summary label="Comision pendiente" value={pendingCommissions.length ? pendingCommissions.map((item) => formatBillingAmount(item.amount, item.currencyCode)).join(" · ") : "0"} icon={<HandCoins className="h-5 w-5" />} />
      </div>
      <p className="mt-2 text-xs text-zinc-500">Comisiones ya pagadas: {paidCommissions.length ? paidCommissions.map((item) => formatBillingAmount(item.amount, item.currencyCode)).join(" · ") : "0"}</p>
      <p className="mt-3 text-sm text-zinc-500">
        Tu cuenta: {labels[ownStatus]}{subscription?.renewsAt ? ` · vence ${formatShortDate(subscription.renewsAt)}` : ""}. La comision se calcula sobre mensualidades efectivamente recibidas.
      </p>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader title="Mis empresas" description="Solo ves datos de suscripcion, limites y vencimientos; los clientes y préstamos siguen siendo privados de cada empresa." />
          <div className="grid gap-3">
            {profile.referredCompanies.map((company) => {
              const plan = company.subscription;
              const status = plan
                ? getBillingStatus(plan.renewsAt, plan.active, settings.gracePeriodDays)
                : "NO_DUE_DATE";
              return (
                <article key={company.id} className="grid gap-2 rounded-xl border border-white/10 bg-carbon-950 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <h3 className="font-bold text-white">{company.name}</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {plan?.name ?? "Sin plan"} · {plan?.maxUsers ?? 0} usuarios · {plan?.maxSellers ?? 0} cobradores
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Mensualidad {plan ? formatBillingAmount(Number(plan.billingAmount), plan.billingCurrency) : "sin configurar"}
                      {plan?.renewsAt ? ` · vence ${formatShortDate(plan.renewsAt)}` : ""}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold ${status === "SUSPENDED" ? "text-rose-300" : status === "GRACE" || status === "DUE_SOON" ? "text-amber-200" : "text-emerald-300"}`}>{labels[status]}</span>
                </article>
              );
            })}
            {!profile.referredCompanies.length ? <p className="rounded-xl border border-white/10 bg-carbon-950 p-4 text-sm text-zinc-400">Todavia no has agregado empresas.</p> : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Agregar empresa" description={`Límite disponible: ${Math.max(profile.maxCompanies - profile.referredCompanies.length, 0)}.`} />
          {profile.referredCompanies.length < profile.maxCompanies ? (
            <TenantCreateForm action={createReferredCompanyAction} plans={plans} submitLabel="Registrar empresa" />
          ) : <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">Llegaste al límite de empresas de tu plan. Contacta al propietario de RUTERO para ampliarlo.</p>}
        </Card>
      </div>
    </AppShell>
  );
}

function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-carbon-900 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-500/10 text-brand-300">{icon}</span>
      <div className="min-w-0"><p className="text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-1 truncate font-bold text-white">{value}</p></div>
    </div>
  );
}

function groupCommissions(commissions: { amount: unknown; currencyCode: string }[]) {
  const totals = new Map<string, number>();
  for (const commission of commissions) totals.set(commission.currencyCode, (totals.get(commission.currencyCode) ?? 0) + Number(commission.amount));
  return Array.from(totals, ([currencyCode, amount]) => ({ currencyCode, amount }));
}

function partnerError(code: string) {
  const messages: Record<string, string> = {
    inactive: "Tu cuenta de socio esta inactiva.",
    limit: "Llegaste al límite de empresas de tu plan.",
    invalid: "Revisa los datos y el plan de la empresa. La contrasena debe tener al menos 10 caracteres.",
    email: "Ese correo ya esta registrado.",
    plan: "El plan seleccionado todavia no tiene un precio mensual configurado."
  };
  return messages[code] ?? "No se pudo completar la operacion.";
}
