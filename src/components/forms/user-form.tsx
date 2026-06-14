"use client";

import { useActionState, useEffect, useRef } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createUserFormAction, type UserFormState } from "@/server/actions/user-actions";

const initialState: UserFormState = { ok: false, message: "" };

export function UserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(createUserFormAction, initialState);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="grid gap-4">
      {state.message ? (
        <p className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"}`}>
          {state.message}
        </p>
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
        <Select name="role" defaultValue="SELLER">
          <option value="SELLER">Cobrador</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="ADMIN">Administrador</option>
        </Select>
      </Field>
      <Field label="Contrasena temporal">
        <Input name="password" type="password" placeholder="Minimo 8, letras y numeros" required aria-invalid={Boolean(state.fieldErrors?.password)} />
        <FieldError message={state.fieldErrors?.password?.[0]} />
      </Field>
      <Button type="submit" disabled={isPending}>
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
