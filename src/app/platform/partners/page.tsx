import { AppShell } from "@/components/layout/app-shell";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { formatBillingAmount, getBillingStatus } from "@/lib/billing";
import { supportedCountries } from "@/lib/countries";
import { RecordPaymentForm } from "@/components/platform/record-payment-form";
import { SubscriptionSettingsForm } from "@/components/platform/subscription-settings-form";
import { formatShortDate } from "@/lib/formatters";
import { getPlatformDashboardData } from "@/lib/platform-data";
import { createPlatformPartnerAction, payPartnerCommissionsAction, updatePartnerStatusAction, updatePartnerTermsAction } from "@/server/actions/platform-actions";

export default async function PlatformPartnersPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; paid?: string; saved?: string }> }) {
  const [{ partners, plans, settings }, params] = await Promise.all([getPlatformDashboardData(), searchParams]);
  const partnerPlans = plans.filter((plan) => plan.active && plan.type === "PARTNER" && Number(plan.monthlyPrice) > 0);

  return (
    <AppShell title="Socios comerciales" subtitle="Cuentas, empresas referidas, limites, mensualidad y comisiones por pagos recibidos.">
      <div className="mb-4"><LinkButton href="/platform" variant="secondary">Volver a empresas</LinkButton></div>
      {params.error ? <p role="status" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{partnerError(params.error)}</p> : null}
      {params.created ? <p role="status" className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Socio creado. Comunica las credenciales por un canal seguro.</p> : null}
      {params.paid || params.saved ? <p role="status" className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Cambios guardados.</p> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-4">
          {partners.map((partner) => {
            const pendingByCurrency = groupCommissions(partner.commissions);
            const ownSubscription = partner.user.company.subscription;
            const ownStatus = ownSubscription
              ? getBillingStatus(ownSubscription.renewsAt, ownSubscription.active, settings.gracePeriodDays)
              : "NO_DUE_DATE";
            return (
              <Card key={partner.id}>
                <CardHeader
                  title={partner.user.name}
                  description={`${partner.user.email} · ${partner.user.company.name} · ${partner.active && partner.user.active ? "Activo" : "Inactivo"}`}
                  action={<span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">{partner._count.referredCompanies}/{partner.maxCompanies} empresas</span>}
                />
                <div className="grid gap-3 border-y border-white/[0.07] py-3 text-sm sm:grid-cols-3">
                  <div><p className="text-xs text-zinc-500">Plan propio</p><p className="mt-1 font-semibold">{ownSubscription?.name ?? "Sin plan"}</p></div>
                  <div><p className="text-xs text-zinc-500">Mensualidad propia</p><p className="mt-1 font-semibold">{ownSubscription ? formatBillingAmount(Number(ownSubscription.billingAmount), ownSubscription.billingCurrency) : "Sin configurar"}</p></div>
                  <div><p className="text-xs text-zinc-500">Vencimiento propio</p><p className="mt-1 font-semibold">{ownSubscription?.renewsAt ? formatShortDate(ownSubscription.renewsAt) : "No definido"} · {statusText(ownStatus)}</p></div>
                </div>
                {ownSubscription ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <details className="group rounded-xl border border-white/10 bg-white/[0.025]">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-brand-300 marker:content-none">
                        <span>Editar plan y vencimiento del socio</span>
                        <span className="text-xs text-zinc-500 group-open:hidden">Abrir</span>
                        <span className="hidden text-xs text-zinc-500 group-open:inline">Cerrar</span>
                      </summary>
                      <div className="px-4 pb-4"><SubscriptionSettingsForm companyId={partner.user.company.id} subscription={ownSubscription} plans={plans} /></div>
                    </details>
                    <details className="group rounded-xl border border-white/10 bg-white/[0.025]">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-brand-300 marker:content-none">
                        <span>Registrar mensualidad del socio</span>
                        <span className="text-xs text-zinc-500 group-open:hidden">Abrir</span>
                        <span className="hidden text-xs text-zinc-500 group-open:inline">Cerrar</span>
                      </summary>
                      <div className="px-4 pb-4"><RecordPaymentForm companyId={partner.user.company.id} subscription={ownSubscription} /></div>
                    </details>
                  </div>
                ) : null}
                {ownSubscription?.payments[0] ? <p className="mt-2 text-xs text-zinc-500">Ultimo pago: {formatShortDate(ownSubscription.payments[0].receivedAt)} · {formatBillingAmount(Number(ownSubscription.payments[0].amount), ownSubscription.payments[0].currencyCode)} · {ownSubscription.payments[0].transactionRef}</p> : null}
                <p className="mt-3 text-xs text-zinc-500">Comision: {(Number(partner.commissionRate) * 100).toFixed(2)}% de cada pago recibido de sus empresas.</p>
                <form action={updatePartnerStatusAction} className="mt-3 flex items-center gap-2 text-xs font-semibold text-zinc-400">
                  <input type="hidden" name="partnerId" value={partner.id} />
                  <input type="checkbox" name="active" value="true" defaultChecked={partner.active && partner.user.active} className="h-4 w-4 accent-orange-500" />
                  Socio habilitado
                  <Button type="submit" variant="ghost" className="min-h-8 px-2 py-1">Actualizar acceso</Button>
                </form>

                <form action={updatePartnerTermsAction} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <input type="hidden" name="partnerId" value={partner.id} />
                  <Field label="Comision (%)"><Input name="commissionRate" type="number" min="0.01" max="100" step="0.01" defaultValue={(Number(partner.commissionRate) * 100).toFixed(2)} required /></Field>
                  <Field label="Límite de empresas"><Input name="maxCompanies" type="number" min={partner._count.referredCompanies} step="1" defaultValue={partner.maxCompanies} required /></Field>
                  <Button type="submit" variant="secondary">Guardar limites</Button>
                </form>

                <div className="mt-4 grid gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Comisiones pendientes</h3>
                  {pendingByCurrency.length ? pendingByCurrency.map((entry) => (
                    <form key={entry.currencyCode} action={payPartnerCommissionsAction} className="grid gap-3 rounded-xl border border-white/10 bg-carbon-950 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
                      <input type="hidden" name="partnerId" value={partner.id} />
                      <input type="hidden" name="currencyCode" value={entry.currencyCode} />
                      <p className="text-sm font-semibold text-amber-200">{formatBillingAmount(entry.amount, entry.currencyCode)}</p>
                      <Field label="Medio">
                        <select name="payoutMethod" className="min-h-11 rounded-xl border border-white/10 bg-carbon-950 px-3 text-sm text-white">
                          <option value="USDT">USDT</option><option value="CRYPTO">Cripto</option><option value="LOCAL_CURRENCY">Moneda local</option>
                        </select>
                      </Field>
                      <Field label="Red"><Input name="payoutNetwork" maxLength={60} placeholder="TRC20, banco..." /></Field>
                      <Field label="Referencia"><Input name="payoutReference" minLength={3} maxLength={160} required placeholder="ID o comprobante" /></Field>
                      <Button type="submit" variant="secondary" className="w-full lg:w-auto">Marcar pagadas</Button>
                    </form>
                  )) : <p className="text-sm text-zinc-500">No tiene comisiones pendientes.</p>}
                </div>
                {partner.payouts.length ? (
                  <details className="group mt-3 rounded-xl border border-white/10 bg-white/[0.025]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-zinc-400 marker:content-none">
                      <span>Ultimos pagos de comisiones</span>
                      <span className="text-xs text-zinc-500 group-open:hidden">Abrir</span>
                      <span className="hidden text-xs text-zinc-500 group-open:inline">Cerrar</span>
                    </summary>
                    <ul className="grid gap-2 px-4 pb-4 text-xs text-zinc-500">
                      {partner.payouts.map((payout, index) => (
                        <li key={`${payout.payoutReference}-${index}`} className="rounded-lg border border-white/[0.07] p-2">
                          {payout.paidAt ? formatShortDate(payout.paidAt) : "Fecha no disponible"} · {formatBillingAmount(Number(payout.amount), payout.currencyCode)} · {payout.payoutMethod ?? "Medio no registrado"}{payout.payoutNetwork ? ` / ${payout.payoutNetwork}` : ""} · {payout.payoutReference ?? "Sin referencia"}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </Card>
            );
          })}
          {!partners.length ? <Card><p className="text-sm text-zinc-400">Todavia no hay socios registrados.</p></Card> : null}
        </div>

        <Card>
          <CardHeader title="Crear socio" description="El socio recibe una cuenta propia y un panel limitado a sus referidos." />
          <form action={createPlatformPartnerAction} className="grid gap-3">
            <Field label="Nombre del negocio o socio"><Input name="companyName" required maxLength={120} /></Field>
            <Field label="Pais">
              <select name="countryCode" defaultValue="VE" className="min-h-11 rounded-xl border border-white/10 bg-carbon-950 px-3.5 text-sm text-white">
                {supportedCountries.map((country) => <option key={country.countryCode} value={country.countryCode}>{country.countryName}</option>)}
              </select>
            </Field>
            <Field label="Plan de socio">
              <select name="planId" required defaultValue="" className="min-h-11 rounded-xl border border-white/10 bg-carbon-950 px-3.5 text-sm text-white">
                <option value="" disabled>Seleccionar plan</option>
                {partnerPlans.filter((plan) => Number(plan.monthlyPrice) > 0).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {Number(plan.monthlyPrice)} {plan.currencyCode} · hasta {plan.maxCompanies} empresas</option>)}
              </select>
            </Field>
            <Field label="Nombre de quien administrará"><Input name="adminName" required maxLength={120} /></Field>
            <Field label="Correo de acceso"><Input name="email" type="email" required maxLength={254} /></Field>
            <Field label="Contrasena inicial" hint="10 a 72 caracteres; compartir por canal seguro."><Input name="password" type="password" minLength={10} maxLength={72} required autoComplete="new-password" /></Field>
            <Field label="Comision sobre pagos recibidos (%)"><Input name="commissionRate" type="number" min="0.01" max="100" step="0.01" required /></Field>
            <Button type="submit">Crear socio</Button>
          </form>
          {!partnerPlans.length ? <p className="mt-3 text-xs leading-5 text-amber-200">Configura el precio mensual y límite del plan Socios antes de dar de alta a un socio.</p> : null}
        </Card>
      </div>
    </AppShell>
  );
}

function groupCommissions(commissions: { amount: unknown; currencyCode: string }[]) {
  const totals = new Map<string, number>();
  for (const commission of commissions) totals.set(commission.currencyCode, (totals.get(commission.currencyCode) ?? 0) + Number(commission.amount));
  return Array.from(totals, ([currencyCode, amount]) => ({ currencyCode, amount }));
}

function partnerError(code: string) {
  const messages: Record<string, string> = {
    invalid: "Revisa los datos del socio, plan, contrasena y comision.",
    email: "Ese correo ya esta registrado.",
    partner: "No se encontro el socio.",
    "invalid-payout": "Revisa el medio, la red y la referencia del pago de comisiones.",
    "no-commission": "No hay comisiones pendientes en esa moneda.",
    "invalid-terms": "Revisa el porcentaje y el límite de empresas.",
    "limit-reduction": "El límite no puede quedor por debajo de la cantidad de empresas ya referidas.",
    price: "Configura primero un precio mensual positivo para el plan Socios."
  };
  return messages[code] ?? "No se pudo completar la operacion.";
}

function statusText(status: ReturnType<typeof getBillingStatus>) {
  const labels: Record<ReturnType<typeof getBillingStatus>, string> = {
    CURRENT: "al día",
    DUE_SOON: "vence pronto",
    GRACE: "en gracia",
    SUSPENDED: "suspendido",
    NO_DUE_DATE: "sin fecha"
  };
  return labels[status];
}
