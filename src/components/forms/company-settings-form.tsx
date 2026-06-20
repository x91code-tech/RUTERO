"use client";

import { useActionState, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import {
  cashboxOpeningModeOptions,
  getDefaultInterestPercent,
  getDefaultTermDays,
  paymentAllocationOrderOptions,
  paymentFrequencyOptions,
  renewalPolicyOptions
} from "@/lib/company-settings";
import type { CurrencyConfig } from "@/lib/countries";
import type { CashboxOpeningMode, Company } from "@/lib/types";
import { updateCompanySettingsAction, type CompanyFormState } from "@/server/actions/company-actions";

const initialState: CompanyFormState = { ok: false, message: "" };

export function CompanySettingsForm({ company, countries }: { company: Company; countries: CurrencyConfig[] }) {
  const [state, action, isPending] = useActionState(updateCompanySettingsAction, initialState);
  const [countryCode, setCountryCode] = useState(company.countryCode);
  const [cashboxOpeningMode, setCashboxOpeningMode] = useState(company.cashboxOpeningMode ?? "MANUAL");
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

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <h3 className="mb-4 font-bold text-white">Reglas operativas</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Interes por defecto %">
            <Input
              name="defaultInterestRatePercent"
              type="number"
              defaultValue={getDefaultInterestPercent(company.defaultInterestRate)}
              min="0"
              max="100"
              step="0.01"
              aria-invalid={Boolean(state.fieldErrors?.defaultInterestRatePercent)}
            />
            <FieldError message={state.fieldErrors?.defaultInterestRatePercent?.[0]} />
          </Field>
          <Field label="Cuotas por defecto">
            <Input
              name="defaultTermDays"
              type="number"
              defaultValue={getDefaultTermDays(company.defaultTermDays)}
              min="1"
              max="365"
              step="1"
              aria-invalid={Boolean(state.fieldErrors?.defaultTermDays)}
            />
            <FieldError message={state.fieldErrors?.defaultTermDays?.[0]} />
          </Field>
          <Field label="Frecuencia">
            <Select name="paymentFrequency" defaultValue={company.paymentFrequency ?? "DAILY"}>
              {paymentFrequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Mora %">
            <Input
              name="lateFeeRatePercent"
              type="number"
              defaultValue={getDefaultInterestPercent(company.lateFeeRate ?? 0)}
              min="0"
              max="100"
              step="0.01"
              aria-invalid={Boolean(state.fieldErrors?.lateFeeRatePercent)}
            />
            <FieldError message={state.fieldErrors?.lateFeeRatePercent?.[0]} />
          </Field>
          <Field label="Dias de gracia mora">
            <Input
              name="lateFeeGraceDays"
              type="number"
              defaultValue={company.lateFeeGraceDays ?? 0}
              min="0"
              max="365"
              step="1"
              aria-invalid={Boolean(state.fieldErrors?.lateFeeGraceDays)}
            />
            <FieldError message={state.fieldErrors?.lateFeeGraceDays?.[0]} />
          </Field>
          <Field label="Orden para aplicar pagos">
            <Select name="paymentAllocationOrder" defaultValue={company.paymentAllocationOrder ?? "LATE_FEE_INTEREST_PRINCIPAL"}>
              {paymentAllocationOrderOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Renovacion de prestamo">
            <Select name="renewalPolicy" defaultValue={company.renewalPolicy ?? "PAID_ONLY"}>
              {renewalPolicyOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Apertura de caja">
            <Select name="cashboxOpeningMode" value={cashboxOpeningMode} onChange={(event) => setCashboxOpeningMode(event.target.value as CashboxOpeningMode)}>
              {cashboxOpeningModeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Hora de apertura">
            <Input
              name="cashboxAutoOpenTime"
              type="time"
              defaultValue={company.cashboxAutoOpenTime ?? "07:00"}
              disabled={cashboxOpeningMode !== "SCHEDULED"}
              aria-invalid={Boolean(state.fieldErrors?.cashboxAutoOpenTime)}
            />
            <FieldError message={state.fieldErrors?.cashboxAutoOpenTime?.[0]} />
          </Field>
        </div>
      </div>

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
