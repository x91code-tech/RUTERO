"use client";

import { useActionState, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { CurrencyConfig } from "@/lib/countries";
import type { Company } from "@/lib/types";
import { updateCompanySettingsAction, type CompanyFormState } from "@/server/actions/company-actions";

const initialState: CompanyFormState = { ok: false, message: "" };

export function CompanySettingsForm({ company, countries }: { company: Company; countries: CurrencyConfig[] }) {
  const [state, action, isPending] = useActionState(updateCompanySettingsAction, initialState);
  const [countryCode, setCountryCode] = useState(company.countryCode);
  const selectedCountry = useMemo(
    () => countries.find((country) => country.countryCode === countryCode) ?? countries[0],
    [countries, countryCode]
  );

  return (
    <form action={action} className="grid gap-4">
      {state.message ? (
        <p className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"}`}>
          {state.message}
        </p>
      ) : null}
      <Field label="Nombre">
        <Input name="name" defaultValue={company.name} aria-invalid={Boolean(state.fieldErrors?.name)} />
        <FieldError message={state.fieldErrors?.name?.[0]} />
      </Field>
      <Field label="Documento fiscal">
        <Input name="rif" defaultValue={company.rif} aria-invalid={Boolean(state.fieldErrors?.rif)} />
        <FieldError message={state.fieldErrors?.rif?.[0]} />
      </Field>
      <Field label="Pais de operacion">
        <Select name="countryCode" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
          {countries.map((country) => (
            <option key={country.countryCode} value={country.countryCode}>
              {country.countryName}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Moneda principal">
        <Input value={`${selectedCountry?.currencyCode ?? company.currencyCode} - ${selectedCountry?.currencyName ?? "Moneda local"}`} readOnly />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Formato regional">
          <Input value={selectedCountry?.locale ?? company.locale} readOnly />
        </Field>
        <Field label="Zona horaria">
          <Input value={selectedCountry?.timeZone ?? company.timeZone} readOnly />
        </Field>
      </div>
      <Field label="Plan">
        <Input value={company.plan} readOnly />
      </Field>
      <Button type="submit" disabled={isPending}>
        <Save className="h-4 w-4" />
        {isPending ? "Guardando..." : "Guardar empresa"}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-medium text-red-300">{message}</span>;
}
