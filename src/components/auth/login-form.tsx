"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const deviceTokenKey = "rutero_device_token";

function getOrCreateDeviceToken() {
  const existing = window.localStorage.getItem(deviceTokenKey);
  if (existing) return existing;
  const token = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(deviceTokenKey, token);
  return token;
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const deviceTokenRef = useRef<HTMLInputElement>(null);
  const deviceNameRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (deviceTokenRef.current) deviceTokenRef.current.value = getOrCreateDeviceToken();
    if (deviceNameRef.current) deviceNameRef.current.value = navigator.userAgent.slice(0, 180);
  }, []);

  function ensureDeviceToken() {
    if (deviceTokenRef.current) deviceTokenRef.current.value = getOrCreateDeviceToken();
    if (deviceNameRef.current) deviceNameRef.current.value = navigator.userAgent.slice(0, 180);
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ensureDeviceToken();
    setError("");
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: new FormData(event.currentTarget),
        credentials: "same-origin",
        headers: {
          "x-rutero-login-fetch": "1"
        }
      });
      const data = await response.json() as { ok?: boolean; message?: string; redirectTo?: string };

      if (!response.ok || !data.ok || !data.redirectTo) {
        setError(data.message ?? "No se pudo iniciar sesion.");
        return;
      }

      window.location.assign(data.redirectTo);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action="/api/auth/login" method="post" onSubmit={submitLogin} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={nextPath ?? ""} />
      <input ref={deviceTokenRef} type="hidden" name="deviceToken" />
      <input ref={deviceNameRef} type="hidden" name="deviceName" />
      {error ? <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      <Field label="Correo">
        <Input name="email" type="email" autoComplete="email" placeholder="admin@empresa.com" />
      </Field>
      <Field label="Contrasena">
        <Input name="password" type="password" autoComplete="current-password" placeholder="Tu contrasena" />
      </Field>
      <Button type="submit" disabled={isPending}>
        <LogIn className="h-4 w-4" />
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
