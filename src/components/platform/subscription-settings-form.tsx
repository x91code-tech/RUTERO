import type { PlatformPlan, SubscriptionPlan } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { updateCompanySubscriptionAction } from "@/server/actions/platform-actions";

export function SubscriptionSettingsForm({ companyId, subscription, plans }: {
  companyId: string;
  subscription: SubscriptionPlan;
  plans: PlatformPlan[];
}) {
  const availablePlans = plans.filter((plan) => plan.type === subscription.planType && (plan.active || plan.id === subscription.platformPlanId));
  return (
    <form action={updateCompanySubscriptionAction} className="grid gap-4 rounded-xl border border-white/10 bg-carbon-950 p-4 sm:grid-cols-2">
      <input type="hidden" name="companyId" value={companyId} />
      <Field label="Plan">
        <Select name="planId" defaultValue={subscription.platformPlanId ?? ""} required>
          {availablePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
        </Select>
      </Field>
      <Field label="Precio acordado mensual">
        <Input name="billingAmount" type="number" min="0.00000001" step="0.00000001" defaultValue={Number(subscription.billingAmount) || ""} required />
      </Field>
      <Field label="Moneda"><Input name="billingCurrency" minLength={2} maxLength={10} defaultValue={subscription.billingCurrency} required /></Field>
      <Field label="Proximo vencimiento">
        <Input
          name="renewsAt"
          type="date"
          defaultValue={subscription.renewsAt?.toISOString().slice(0, 10) ?? ""}
          required
        />
      </Field>
      <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-zinc-300">
        <input type="checkbox" name="active" value="true" defaultChecked={subscription.active} className="h-4 w-4 accent-orange-500" />
        Cuenta habilitada
      </label>
      <div className="sm:col-span-2"><Button type="submit" variant="secondary" className="w-full sm:w-auto">Guardar suscripcion</Button></div>
    </form>
  );
}
