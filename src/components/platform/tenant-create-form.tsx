import type { PlatformPlan } from "@prisma/client";
import { supportedCountries } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";

export function TenantCreateForm({
  plans,
  action,
  submitLabel,
  partnerOptions,
  includePartner
}: {
  plans: PlatformPlan[];
  action: (formData: FormData) => Promise<never>;
  submitLabel: string;
  partnerOptions?: { id: string; name: string }[];
  includePartner?: boolean;
}) {
  const tenantPlans = plans.filter((plan) => plan.type !== "PARTNER");
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Field label="Nombre de la empresa"><Input name="companyName" required maxLength={120} /></Field>
      <Field label="Pais">
        <Select name="countryCode" defaultValue="VE" required>
          {supportedCountries.map((country) => <option key={country.countryCode} value={country.countryCode}>{country.countryName}</option>)}
        </Select>
      </Field>
      <Field label="Documento fiscal (opcional)"><Input name="rif" maxLength={40} /></Field>
      <Field label="Plan">
        <Select name="planId" required defaultValue="">
          <option value="" disabled>Seleccionar plan</option>
          {tenantPlans.filter((plan) => Number(plan.monthlyPrice) > 0).map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {Number(plan.monthlyPrice)} {plan.currencyCode}</option>)}
        </Select>
      </Field>
      {includePartner ? (
        <Field label="Socio que la refiere (opcional)">
          <Select name="partnerId" defaultValue="">
            <option value="">Venta directa</option>
            {partnerOptions?.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
          </Select>
        </Field>
      ) : null}
      <Field label="Nombre del administrador"><Input name="adminName" required maxLength={120} /></Field>
      <Field label="Correo de acceso"><Input name="email" type="email" required maxLength={254} /></Field>
      <Field label="Contrasena inicial" hint="10 a 72 caracteres; entregala por un canal seguro.">
        <Input name="password" type="password" minLength={10} maxLength={72} autoComplete="new-password" required />
      </Field>
      <div className="sm:col-span-2"><Button type="submit" className="w-full sm:w-auto">{submitLabel}</Button></div>
    </form>
  );
}
