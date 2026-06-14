"use client";

import { useActionState, useEffect, useRef } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { loginFormAction, type AuthFormState } from "@/server/actions/auth-actions";

const initialState: AuthFormState = { ok: false, message: "" };
const deviceTokenKey = "rutero_device_token";

function getOrCreateDeviceToken() {
  const existing = window.localStorage.getItem(deviceTokenKey);
  if (existing) return existing;
  const token = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(deviceTokenKey, token);
  return token;
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, isPending] = useActionState(loginFormAction, initialState);
  const deviceTokenRef = useRef<HTMLInputElement>(null);
  const deviceNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (deviceTokenRef.current) deviceTokenRef.current.value = getOrCreateDeviceToken();
    if (deviceNameRef.current) deviceNameRef.current.value = navigator.userAgent.slice(0, 180);
  }, []);

  function ensureDeviceToken() {
    if (deviceTokenRef.current) deviceTokenRef.current.value = getOrCreateDeviceToken();
    if (deviceNameRef.current) deviceNameRef.current.value = navigator.userAgent.slice(0, 180);
  }

  return (
    <form action={action} onSubmit={ensureDeviceToken} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={nextPath ?? ""} />
      <input ref={deviceTokenRef} type="hidden" name="deviceToken" />
      <input ref={deviceNameRef} type="hidden" name="deviceName" />
      {state.message ? <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{state.message}</p> : null}
      <Field label="Correo">
        <Input name="email" type="email" autoComplete="email" placeholder="admin@empresa.com" aria-invalid={Boolean(state.fieldErrors?.email)} />
        <FieldError message={state.fieldErrors?.email?.[0]} />
      </Field>
      <Field label="Contrasena">
        <Input name="password" type="password" autoComplete="current-password" placeholder="Tu contrasena" aria-invalid={Boolean(state.fieldErrors?.password)} />
        <FieldError message={state.fieldErrors?.password?.[0]} />
      </Field>
      <Button type="submit" disabled={isPending}>
        <LogIn className="h-4 w-4" />
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-medium text-red-300">{message}</span>;
}
