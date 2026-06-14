"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { mobileLoginFormAction, type AuthFormState } from "@/server/actions/auth-actions";

const initialState: AuthFormState = { ok: false, message: "" };
const deviceTokenKey = "rutero_device_token";
const collectorIdKey = "rutero_collector_id";

function getOrCreateDeviceToken() {
  const existing = window.localStorage.getItem(deviceTokenKey);
  if (existing) return existing;
  const token = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(deviceTokenKey, token);
  return token;
}

export function MobileLoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, isPending] = useActionState(mobileLoginFormAction, initialState);
  const [savedIdentifier, setSavedIdentifier] = useState("");
  const deviceTokenRef = useRef<HTMLInputElement>(null);
  const deviceNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSavedIdentifier(window.localStorage.getItem(collectorIdKey) ?? "");
    if (deviceTokenRef.current) deviceTokenRef.current.value = getOrCreateDeviceToken();
    if (deviceNameRef.current) deviceNameRef.current.value = navigator.userAgent.slice(0, 180);
  }, []);

  function prepareSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const rawIdentifier = typeof formData.get("identifier") === "string" ? String(formData.get("identifier")) : "";
    const identifier = (savedIdentifier || rawIdentifier).trim().toUpperCase().replace(/\s+/g, "");
    if (identifier) window.localStorage.setItem(collectorIdKey, identifier);
    if (deviceTokenRef.current) deviceTokenRef.current.value = getOrCreateDeviceToken();
    if (deviceNameRef.current) deviceNameRef.current.value = navigator.userAgent.slice(0, 180);
  }

  return (
    <form action={action} onSubmit={prepareSubmit} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={nextPath ?? "/seller"} />
      <input ref={deviceTokenRef} type="hidden" name="deviceToken" />
      <input ref={deviceNameRef} type="hidden" name="deviceName" />
      {state.message ? <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{state.message}</p> : null}
      {savedIdentifier ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase text-zinc-500">Identificador del telefono</p>
          <p className="mt-1 font-mono text-2xl font-black text-white">{savedIdentifier}</p>
          <input type="hidden" name="identifier" value={savedIdentifier} />
        </div>
      ) : (
        <Field label="Identificador">
          <Input name="identifier" autoComplete="username" placeholder="COB-123456" aria-invalid={Boolean(state.fieldErrors?.identifier)} />
          <FieldError message={state.fieldErrors?.identifier?.[0]} />
        </Field>
      )}
      <Field label="PIN de 4 numeros">
        <Input name="pin" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="one-time-code" placeholder="1234" aria-invalid={Boolean(state.fieldErrors?.pin)} />
        <FieldError message={state.fieldErrors?.pin?.[0]} />
      </Field>
      <p className="text-xs text-zinc-500">Si necesitas usar otro telefono, el administrador debe liberar el dispositivo actual.</p>
      <Button type="submit" disabled={isPending}>
        <Smartphone className="h-4 w-4" />
        {isPending ? "Entrando..." : "Entrar como cobrador"}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-medium text-red-300">{message}</span>;
}
