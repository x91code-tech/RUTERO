"use client";

import { useActionState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { mobileLoginFormAction, type AuthFormState } from "@/server/actions/auth-actions";

const initialState: AuthFormState = { ok: false, message: "" };

export function MobileLoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, isPending] = useActionState(mobileLoginFormAction, initialState);

  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={nextPath ?? "/seller"} />
      {state.message ? <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{state.message}</p> : null}
      <Field label="Identificador">
        <Input name="identifier" autoComplete="username" placeholder="COB-123456" aria-invalid={Boolean(state.fieldErrors?.identifier)} />
        <FieldError message={state.fieldErrors?.identifier?.[0]} />
      </Field>
      <Field label="PIN de 4 numeros">
        <Input name="pin" type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="one-time-code" placeholder="1234" aria-invalid={Boolean(state.fieldErrors?.pin)} />
        <FieldError message={state.fieldErrors?.pin?.[0]} />
      </Field>
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
