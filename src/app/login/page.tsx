import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { CollectorLoginRedirect } from "@/components/auth/collector-login-redirect";
import { LoginForm } from "@/components/auth/login-form";
import { RuteroLogo } from "@/components/brand/rutero-logo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;

  return (
    <main className="grid min-h-screen bg-carbon-950 px-5 py-8 lg:grid-cols-[1fr_28rem] lg:px-8">
      <CollectorLoginRedirect />
      <section className="hidden min-h-[calc(100vh-4rem)] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-8 lg:flex">
        <RuteroLogo href="/" size="md" />
        <div>
          <p className="max-w-2xl text-5xl font-black leading-tight text-white">Control diario de prestamos, rutas y caja en calle.</p>
          <p className="mt-5 max-w-xl text-zinc-400">
            RUTERO organiza clientes, cuotas diarias, recaudos, cobradores, ubicaciones y saldos por empresa.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-carbon-900/80 p-4"><p className="text-zinc-500">Prestamos</p><p className="mt-1 font-bold text-white">20% y cuota diaria</p></div>
          <div className="rounded-xl bg-carbon-900/80 p-4"><p className="text-zinc-500">Rutas</p><p className="mt-1 font-bold text-white">Recaudo por cobrador</p></div>
          <div className="rounded-xl bg-carbon-900/80 p-4"><p className="text-zinc-500">Caja</p><p className="mt-1 font-bold text-white">Cierre operativo</p></div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center lg:pl-8">
        <div className="surface rounded-2xl p-6">
          <RuteroLogo href="/" size="sm" className="mb-8 lg:hidden" />
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-carbon-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">Iniciar sesion</h1>
          <p className="mt-2 text-sm text-zinc-400">Entra con el usuario de tu empresa para ver tu dashboard, ruta o caja diaria.</p>
          {error ? <p className="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{decodeURIComponent(error)}</p> : null}
          <LoginForm nextPath={next} />
          <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
            <Link href="/register" className="font-semibold text-brand-400 hover:text-brand-300">Crear empresa</Link>
            <Link href="/mobile-login" className="font-semibold text-brand-400 hover:text-brand-300">Acceso cobrador</Link>
          </div>
          <p className="mt-3 text-xs text-zinc-500">Demo: admin@rutero.app</p>
        </div>
      </section>
    </main>
  );
}
