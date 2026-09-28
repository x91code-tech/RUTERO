"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (deviceTokenRef.current) deviceTokenRef.current.value = getOrCreateDeviceToken();
    if (deviceNameRef.current) deviceNameRef.current.value = navigator.userAgent.slice(0, 180);
  }, []);

  function ensureDeviceToken() {
    if (deviceTokenRef.current) deviceTokenRef.current.value = getOrCreateDeviceToken();
    if (deviceNameRef.current) deviceNameRef.current.value = navigator.userAgent.slice(0, 180);
  }

  return (
    <form action="/api/auth/login" method="post" onSubmit={ensureDeviceToken} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={nextPath ?? ""} />
      <input ref={deviceTokenRef} type="hidden" name="deviceToken" />
      <input ref={deviceNameRef} type="hidden" name="deviceName" />
      <Field label="Correo">
        <Input name="email" type="email" autoComplete="email" placeholder="admin@empresa.com" />
      </Field>
      <Field label="Contrasena">
        <Input name="password" type="password" autoComplete="current-password" placeholder="Tu contrasena" />
      </Field>
      <Button type="submit">
        <LogIn className="h-4 w-4" />
        Entrar
      </Button>
    </form>
  );
}
