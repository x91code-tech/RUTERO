"use client";

import { useActionState } from "react";
import { SmartphoneNfc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { releaseCollectorDeviceFormAction, type DeviceFormState } from "@/server/actions/user-actions";

const initialState: DeviceFormState = { ok: false, message: "" };

export function ReleaseCollectorDeviceForm({ userId, disabled }: { userId: string; disabled: boolean }) {
  const [state, action, isPending] = useActionState(releaseCollectorDeviceFormAction, initialState);

  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" variant="secondary" disabled={disabled || isPending} className="w-full sm:w-auto">
        <SmartphoneNfc className="h-4 w-4" />
        {isPending ? "Liberando..." : "Liberar telefono"}
      </Button>
      {state.message ? (
        <p className={`rounded-xl px-3 py-2 text-xs ${state.ok ? "bg-emerald-500/15 text-emerald-100" : "bg-red-500/15 text-red-200"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
