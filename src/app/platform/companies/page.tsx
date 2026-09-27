import { RecordPaymentForm } from "@/components/platform/record-payment-form";
import { SubscriptionSettingsForm } from "@/components/platform/subscription-settings-form";
import { SubscriptionSetupForm } from "@/components/platform/subscription-setup-form";
import { AppShell } from "@/components/layout/app-shell";
import { LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatBillingAmount, getBillingStatus } from "@/lib/billing";
import { formatShortDate } from "@/lib/formatters";
import { getPlatformDashboardData } from "@/lib/platform-data";

const billingStatusLabels = {
  CURRENT: { label: "Al dia", tone: "green" as const },
  DUE_SOON: { label: "Vence pronto", tone: "orange" as const },
  GRACE: { label: "En periodo de gracia", tone: "orange" as const },
  SUSPENDED: { label: "Suspendida", tone: "red" as const },
  NO_DUE_DATE: { label: "Sin vencimiento", tone: "gray" as const }
};

export default async function PlatformCompaniesPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; received?: string; saved?: string }> }) {
  const [{ companies, plans, settings }, params] = await Promise.all([
    getPlatformDashboardData(),
    searchParams
  ]);
  const activePlans = plans.filter((plan) => plan.active && plan.type !== "PARTNER" && Number(plan.monthlyPrice) > 0);

  return (
    <AppShell title="Empresas" subtitle="Contratos, vencimientos, pagos recibidos y estado de cada cuenta.">
      {params.error ? <Feedback message={errorMessage(params.error)} error /> : null}
      {params.created === "subscription" ? <Feedback message="La suscripcion quedo asignada." /> : null}
      {params.received ? <Feedback message="Pago registrado y vencimiento actualizado." /> : null}
      {params.saved ? <Feedback message="Contrato actualizado." /> : null}

      <Card>
        <CardHeader
          title="Empresas y vencimientos"
          description="Administra plan, limites, fecha de renovacion y pagos recibidos."
          action={<LinkButton href="/platform/companies/new">Nueva empresa</LinkButton>}
        />
        <div className="grid gap-3">
          {companies.map((company) => {
            const subscription = company.subscription;
            const billingStatus = subscription
              ? getBillingStatus(subscription.renewsAt, subscription.active, settings.gracePeriodDays)
              : "NO_DUE_DATE";
            const status = billingStatusLabels[billingStatus];

            return (
              <article key={company.id} className="grid gap-4 rounded-xl border border-white/10 bg-carbon-950 p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-white">{company.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {subscription?.name ?? "Sin plan"} · {company._count.users} usuarios
                      {subscription ? ` / ${subscription.maxUsers}; cobradores hasta ${subscription.maxSellers}` : ""}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      Socio: {company.referredByPartner?.user.name ?? "Venta directa"} · Mensualidad: {subscription ? formatBillingAmount(Number(subscription.billingAmount), subscription.billingCurrency) : "Sin configurar"}
                    </p>
                    {company.users[0] ? <p className="mt-1 truncate text-xs leading-5 text-zinc-500">Contacto: {company.users[0].name} · {company.users[0].email}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    {subscription ? <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-400">{company.currencyCode}</span> : null}
                  </div>
                </div>

                {subscription ? (
                  <>
                    <div className="grid gap-3 border-t border-white/[0.07] pt-3 text-xs text-zinc-400 sm:grid-cols-3">
                      <Fact label="Vence" value={subscription.renewsAt ? formatShortDate(subscription.renewsAt) : "No definido"} />
                      <Fact label="Mensualidad" value={formatBillingAmount(Number(subscription.billingAmount), subscription.billingCurrency)} />
                      <Fact label="Operacion" value={company.currencyCode} />
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <details className="group rounded-xl border border-white/10 bg-white/[0.025]">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-brand-300 marker:content-none">
                          <span>Editar plan, limites o vencimiento</span>
                          <span className="text-xs text-zinc-500 group-open:hidden">Abrir</span>
                          <span className="hidden text-xs text-zinc-500 group-open:inline">Cerrar</span>
                        </summary>
                        <div className="px-4 pb-4"><SubscriptionSettingsForm companyId={company.id} subscription={subscription} plans={plans} /></div>
                      </details>
                      <details className="group rounded-xl border border-white/10 bg-white/[0.025]">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-brand-300 marker:content-none">
                          <span>Registrar pago recibido</span>
                          <span className="text-xs text-zinc-500 group-open:hidden">Abrir</span>
                          <span className="hidden text-xs text-zinc-500 group-open:inline">Cerrar</span>
                        </summary>
                        <div className="px-4 pb-4"><RecordPaymentForm companyId={company.id} subscription={subscription} /></div>
                      </details>
                    </div>
                    {subscription.payments.length ? (
                      <p className="text-xs text-zinc-500">
                        Ultimo pago: {formatShortDate(subscription.payments[0].receivedAt)} · {formatBillingAmount(Number(subscription.payments[0].amount), subscription.payments[0].currencyCode)} · {subscription.payments[0].paymentMethod}{subscription.payments[0].network ? ` / ${subscription.payments[0].network}` : ""} · {subscription.payments[0].transactionRef}
                      </p>
                    ) : <p className="text-xs text-zinc-500">Todavia no hay pagos registrados.</p>}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-amber-200">Falta asignar un plan y fecha de vencimiento.</p>
                    <SubscriptionSetupForm companyId={company.id} plans={activePlans} />
                  </>
                )}
              </article>
            );
          })}
          {!companies.length ? <p className="rounded-xl border border-white/10 bg-carbon-950 p-4 text-sm text-zinc-400">Aun no hay empresas cliente registradas.</p> : null}
        </div>
      </Card>
    </AppShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function Feedback({ message, error = false }: { message: string; error?: boolean }) {
  return <p role="status" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-500/20 bg-rose-500/10 text-rose-200" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"}`}>{message}</p>;
}

function errorMessage(code: string) {
  const messages: Record<string, string> = {
    "invalid-payment": "Verifica monto, moneda, medio de pago, meses y referencia de la transaccion.",
    subscription: "La empresa no tiene una suscripcion administrable.",
    "duplicate-payment": "Ya existe un pago registrado con esa referencia para esta empresa.",
    "invalid-contract": "Verifica plan, precio, moneda y fecha de vencimiento.",
    "subscription-exists": "La empresa ya tiene una suscripcion; actualiza el plan desde su ficha.",
    company: "No se encontro la empresa seleccionada.",
    "contract-below-usage": "No se puede guardar un plan cuyos limites sean menores que los usuarios o cobradores actuales."
  };
  return messages[code] ?? "No se pudo completar la operacion.";
}
