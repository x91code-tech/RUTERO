"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetCollectorPinFormAction, type PinFormState } from "@/server/actions/user-actions";

const initialState: PinFormState = { ok: false, message: "" };

export function ResetCollectorPinForm({ userId, hasMobileAccess }: { userId: string; hasMobileAccess: boolean }) {
  const [state, action, isPending] = useActionState(resetCollectorPinFormAction, initialState);

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" variant="secondary" disabled={isPending} className="w-full sm:w-auto">
        <KeyRound className="h-4 w-4" />
        {isPending ? "Generando..." : hasMobileAccess ? "Regenerar PIN" : "Generar PIN"}
      </Button>
      {state.message ? (
        <div className={`rounded-xl px-3 py-2 text-xs ${state.ok ? "bg-emerald-500/15 text-emerald-100" : "bg-red-500/15 text-red-200"}`}>
          <p>{state.message}</p>
          {state.ok && state.mobileIdentifier && state.pin ? (
            <p className="mt-1 font-mono text-sm text-white">ID {state.mobileIdentifier} / PIN {state.pin}</p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
