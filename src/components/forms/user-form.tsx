"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { CurrencyConfig } from "@/lib/countries";
import { getCurrencyConfig } from "@/lib/countries";
import { createUserFormAction, type UserFormState } from "@/server/actions/user-actions";

const initialState: UserFormState = { ok: false, message: "" };

export function UserForm({
  countries,
  defaultCountryCode,
  disabledReason = "",
  sellerLimitReached = false
}: {
  countries: CurrencyConfig[];
  defaultCountryCode: string;
  disabledReason?: string;
  sellerLimitReached?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(createUserFormAction, initialState);
  const [role, setRole] = useState("SELLER");
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const country = getCurrencyConfig({ countryCode });
  const roleBlockedReason = disabledReason || (role === "SELLER" && sellerLimitReached ? "El plan ya alcanzo el maximo de cobradores activos. Puedes crear supervisor o administrador si queda cupo de usuarios." : "");

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  useEffect(() => {
    if (sellerLimitReached && role === "SELLER" && !disabledReason) setRole("SUPERVISOR");
  }, [disabledReason, role, sellerLimitReached]);

  return (
    <form ref={formRef} action={action} className="grid gap-4">
      {roleBlockedReason ? <p className="rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-amber-100">{roleBlockedReason}</p> : null}
      {state.message ? (
        <p className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"}`}>
          {state.message}
        </p>
      ) : null}
      {state.ok && state.mobileIdentifier && state.pin ? (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <p className="font-bold">Acceso del telefono</p>
          <p className="mt-2">Identificador: <span className="font-mono text-lg text-white">{state.mobileIdentifier}</span></p>
          <p>PIN: <span className="font-mono text-lg text-white">{state.pin}</span></p>
          <p className="mt-2 text-xs text-emerald-200/80">Este PIN se muestra una sola vez. Si se pierde, regeneralo desde la lista de usuarios.</p>
        </div>
      ) : null}
      <Field label="Nombre">
        <Input name="name" placeholder="Nombre del usuario" required aria-invalid={Boolean(state.fieldErrors?.name)} />
        <FieldError message={state.fieldErrors?.name?.[0]} />
      </Field>
      <Field label="Correo">
        <Input name="email" type="email" placeholder="cobrador@empresa.com" required aria-invalid={Boolean(state.fieldErrors?.email)} />
        <FieldError message={state.fieldErrors?.email?.[0]} />
      </Field>
      <Field label="Rol">
        <Select name="role" value={role} onChange={(event) => setRole(event.target.value)} disabled={Boolean(disabledReason)}>
          <option value="SELLER" disabled={sellerLimitReached}>Cobrador</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="ADMIN">Administrador</option>
        </Select>
      </Field>
      {role === "SELLER" ? (
        <div className="grid gap-3 rounded-xl border border-white/10 bg-carbon-950 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Pais del cobrador">
            <Select name="countryCode" value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
              {countries.map((item) => (
                <option key={item.countryCode} value={item.countryCode}>{item.countryName}</option>
              ))}
            </Select>
          </Field>
          <p className="pb-3 text-sm text-zinc-400">
            Moneda de su cartera: <span className="font-semibold text-white">{country.currencyCode} · {country.currencyName}</span>
          </p>
        </div>
      ) : <input type="hidden" name="countryCode" value={defaultCountryCode} />}
      <Field label="Contrasena temporal">
        <Input name="password" type="password" placeholder="Minimo 8, letras y numeros" required aria-invalid={Boolean(state.fieldErrors?.password)} />
        <FieldError message={state.fieldErrors?.password?.[0]} />
      </Field>
      <Button type="submit" disabled={isPending || Boolean(roleBlockedReason)}>
        <UserPlus className="h-4 w-4" />
        {isPending ? "Creando..." : "Crear usuario"}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-medium text-red-300">{message}</span>;
}
