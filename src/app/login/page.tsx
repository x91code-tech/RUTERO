import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { CollectorLoginRedirect } from "@/components/auth/collector-login-redirect";
import { LoginForm } from "@/components/auth/login-form";
import { RuteroLogo } from "@/components/brand/rutero-logo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;

  return (
    <main className="min-h-screen bg-carbon-950 px-4 py-5 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-6 lg:px-8">
      <CollectorLoginRedirect />
      <section className="hidden min-h-[calc(100vh-2.5rem)] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-carbon-900/85 p-7 shadow-panel lg:flex">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <RuteroLogo href="/" size="md" />
          <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-200">Operacion financiera</span>
        </div>
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-brand-300">RUTERO</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-[-0.06em] text-white xl:text-5xl">
            Prestamos, recaudos y caja diaria bajo control.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            Accede al panel de tu empresa para revisar cartera, abrir cajas, controlar cobradores y cerrar la jornada con datos consistentes.
          </p>
        </div>
        <div className="grid border-t border-white/10 pt-5 text-sm sm:grid-cols-3">
          <div className="border-white/10 py-3 sm:border-r sm:pr-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Cartera</p>
            <p className="mt-1 font-black text-white">Saldos y cuotas</p>
          </div>
          <div className="border-white/10 py-3 sm:border-r sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Ruta</p>
            <p className="mt-1 font-black text-white">Cobradores activos</p>
          </div>
          <div className="py-3 sm:pl-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Caja</p>
            <p className="mt-1 font-black text-white">Cierre diario</p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-3xl border border-white/10 bg-carbon-900/85 p-5 shadow-panel sm:p-6">
          <RuteroLogo href="/" size="sm" className="mb-7 lg:hidden" />
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-[-0.05em]">Iniciar sesion</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Usa tu cuenta de empresa. Los cobradores pueden entrar con PIN desde su telefono vinculado.</p>
          {error ? <p className="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{decodeURIComponent(error)}</p> : null}
          <LoginForm nextPath={next} />
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm text-zinc-400">
            <Link href="/register" className="font-semibold text-brand-400 hover:text-brand-300">Crear empresa</Link>
            <Link href="/mobile-login" className="font-semibold text-brand-400 hover:text-brand-300">Acceso cobrador</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
