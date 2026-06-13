import Link from "next/link";
import { ArrowRight, BarChart3, MapPinned, ShieldCheck } from "lucide-react";
import { demoCompany } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/formatters";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden px-5 py-6 sm:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 font-black text-carbon-950">R</span>
          <span className="text-lg font-bold">RUTERO</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link className="hidden rounded-lg px-4 py-2 text-sm text-zinc-300 hover:text-white sm:block" href="/login">
            Iniciar sesión
          </Link>
          <Link className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-carbon-950" href="/register">
            Crear empresa
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-10 py-12 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-sm text-orange-100">
            <ShieldCheck className="h-4 w-4 text-brand-500" />
            SaaS multiempresa para equipos en ruta
          </div>
          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
            RUTERO
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-zinc-300">
            Controla tus rutas, ventas, recaudos y caja diaria en tiempo real.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-4 font-bold text-carbon-950 shadow-glow" href="/login">
              Iniciar sesión <ArrowRight className="h-5 w-5" />
            </Link>
            <Link className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-4 font-semibold text-white hover:bg-white/10" href="/register">
              Crear empresa
            </Link>
          </div>
        </div>

        <div className="surface relative rounded-2xl p-4">
          <div className="rounded-xl bg-carbon-900 p-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-zinc-400">Hoy</p>
                <h2 className="text-xl font-bold">Orange Store Demo</h2>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">En ruta</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Ventas", formatCurrency(2840, demoCompany)],
                ["Recaudos", formatCurrency(1920, demoCompany)],
                ["Caja esperada", formatCurrency(3410, demoCompany)],
                ["Diferencia", formatCurrency(0, demoCompany)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm text-zinc-400">{label}</p>
                  <p className="mt-2 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-brand-500 p-5 text-carbon-950">
              <div className="flex items-center gap-3">
                <MapPinned className="h-6 w-6" />
                <div>
                  <p className="font-bold">Ruta Centro</p>
                  <p className="text-sm opacity-80">8 clientes visitados, 3 pendientes</p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 p-4">
              <BarChart3 className="h-10 w-10 text-brand-500" />
              <p className="text-sm text-zinc-300">Alertas, cierres y reportes listos para compartir por WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
