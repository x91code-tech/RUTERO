"use client";

import { useActionState, useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { CurrencyConfig } from "@/lib/countries";
import { registerCompanyFormAction, type AuthFormState } from "@/server/actions/auth-actions";

const initialState: AuthFormState = { ok: false, message: "" };

export function RegisterForm({ countries }: { countries: CurrencyConfig[] }) {
  const [state, action, isPending] = useActionState(registerCompanyFormAction, initialState);
  const [countryCode, setCountryCode] = useState(countries[0]?.countryCode ?? "VE");
  const selectedCountry = useMemo(
    () => countries.find((country) => country.countryCode === countryCode) ?? countries[0],
    [countries, countryCode]
  );

  return (
    <form action={action} className="mt-6 grid gap-4 sm:grid-cols-2">
      {state.message ? <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200 sm:col-span-2">{state.message}</p> : null}
      <Field label="Nombre de empresa">
        <Input name="companyName" placeholder="Mi empresa" autoComplete="organization" aria-invalid={Boolean(state.fieldErrors?.companyName)} />
        <FieldError message={state.fieldErrors?.companyName?.[0]} />
      </Field>
      <Field label="Documento fiscal">
        <Input name="rif" placeholder="RIF, RNC, NIT, RFC..." aria-invalid={Boolean(state.fieldErrors?.rif)} />
        <FieldError message={state.fieldErrors?.rif?.[0]} />
      </Field>
      <Field label="Pais">
        <Select name="countryCode" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
          {countries.map((country) => (
            <option key={country.countryCode} value={country.countryCode}>
              {country.countryName}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Moneda">
        <input type="hidden" name="currencyCode" value={selectedCountry?.currencyCode ?? "VES"} />
        <Input value={`${selectedCountry?.currencyCode ?? "VES"} - ${selectedCountry?.currencyName ?? "Moneda local"}`} readOnly />
      </Field>
      <Field label="Nombre del administrador">
        <Input name="adminName" placeholder="Tu nombre" autoComplete="name" aria-invalid={Boolean(state.fieldErrors?.adminName)} />
        <FieldError message={state.fieldErrors?.adminName?.[0]} />
      </Field>
      <Field label="Correo">
        <Input name="email" type="email" placeholder="admin@empresa.com" autoComplete="email" aria-invalid={Boolean(state.fieldErrors?.email)} />
        <FieldError message={state.fieldErrors?.email?.[0]} />
      </Field>
      <Field label="Contrasena">
        <Input name="password" type="password" placeholder="Minimo 8, letras y numeros" autoComplete="new-password" aria-invalid={Boolean(state.fieldErrors?.password)} />
        <FieldError message={state.fieldErrors?.password?.[0]} />
      </Field>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
        La empresa queda lista con rol ADMIN, moneda por pais, plan PRO y cobradores internos.
      </div>
      <Button type="submit" disabled={isPending} className="sm:col-span-2">
        <Building2 className="h-4 w-4" />
        {isPending ? "Creando empresa..." : "Crear empresa"}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-medium text-red-300">{message}</span>;
}
