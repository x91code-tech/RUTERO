import type { PlatformPlan } from "@prisma/client";
import { addBillingMonths } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createCompanySubscriptionAction } from "@/server/actions/platform-actions";

export function SubscriptionSetupForm({ companyId, plans }: { companyId: string; plans: PlatformPlan[] }) {
  const firstPlan = plans[0];
  const defaultRenewalDate = addBillingMonths(new Date(), 1).toISOString().slice(0, 10);

  if (!firstPlan) {
    return <p className="mt-3 text-xs text-amber-200">Configura el precio mensual y los limites de un plan antes de asignarlo.</p>;
  }

  return (
    <details className="group rounded-xl border border-white/10 bg-white/[0.025]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-brand-300 marker:content-none">
        <span>Asignar primera suscripcion</span>
        <span className="text-xs text-zinc-500 group-open:hidden">Abrir</span>
        <span className="hidden text-xs text-zinc-500 group-open:inline">Cerrar</span>
      </summary>
      <form action={createCompanySubscriptionAction} className="mx-4 mb-4 grid gap-4 rounded-xl border border-white/10 bg-carbon-950 p-4 sm:grid-cols-2">
        <input type="hidden" name="companyId" value={companyId} />
        <Field label="Plan">
          <Select name="planId" defaultValue={firstPlan.id} required>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {plan.maxUsers} usuarios · {plan.maxSellers} cobradores</option>)}
          </Select>
        </Field>
        <Field label="Precio mensual acordado">
          <Input name="billingAmount" type="number" min="0.00000001" step="0.00000001" defaultValue={Number(firstPlan.monthlyPrice)} required />
        </Field>
        <Field label="Moneda"><Input name="billingCurrency" minLength={2} maxLength={10} defaultValue={firstPlan.currencyCode} required /></Field>
        <Field label="Proximo vencimiento">
          <Input name="renewsAt" type="date" defaultValue={defaultRenewalDate} required />
        </Field>
        <p className="text-xs leading-5 text-zinc-500 sm:col-span-2">El precio y la moneda quedon acordados para esta cuenta; los limites se copian del plan seleccionado.</p>
        <div className="sm:col-span-2"><Button type="submit" variant="secondary" className="w-full sm:w-auto">Asignar suscripcion</Button></div>
      </form>
    </details>
  );
}
