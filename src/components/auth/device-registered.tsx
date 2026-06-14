"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

const collectorIdKey = "rutero_collector_id";

export function DeviceRegistered({ identifier }: { identifier?: string }) {
  useEffect(() => {
    if (identifier) window.localStorage.setItem(collectorIdKey, identifier);
  }, [identifier]);

  return (
    <div className="surface mx-auto max-w-md rounded-2xl p-6">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-carbon-950">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-black">Telefono vinculado</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Este dispositivo quedo casado con tu usuario de cobrador. Para cambiar de telefono, habla con el administrador.
      </p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs uppercase text-zinc-500">Tu identificador</p>
        <p className="mt-1 font-mono text-2xl font-black text-white">{identifier ?? "Sin generar"}</p>
      </div>
      <LinkButton href="/seller" className="mt-5 w-full">Ir a mi ruta</LinkButton>
      <p className="mt-4 text-xs text-zinc-500">La proxima vez entra por Acceso cobrador y escribe solo tu PIN.</p>
    </div>
  );
}
