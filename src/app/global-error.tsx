"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-[#0b0a09] p-6 text-white">
          <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#171412] p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">RUTERO</p>
            <h1 className="mt-3 text-2xl font-black">La app necesita recargar</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Se detecto una version anterior en memoria. Recarga para abrir la version mas reciente.
            </p>
            {error.digest ? <p className="mt-3 text-xs text-zinc-500">Codigo: {error.digest}</p> : null}
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={() => window.location.assign("/login")}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-zinc-100"
              >
                Volver al inicio
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
