"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { loginFormAction, type AuthFormState } from "@/server/actions/auth-actions";

const initialState: AuthFormState = { ok: false, message: "" };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, isPending] = useActionState(loginFormAction, initialState);

  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={nextPath ?? ""} />
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
