import Link from "next/link";
import { Building2, CheckCircle2 } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { RuteroLogo } from "@/components/brand/rutero-logo";
import { supportedCountries } from "@/lib/countries";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-carbon-950 px-4 py-5 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_34rem] lg:gap-6 lg:px-8">
      <section className="hidden min-h-[calc(100vh-2.5rem)] flex-col justify-between rounded-xl border border-white/10 bg-carbon-900 p-7 lg:flex">
        <div className="border-b border-white/10 pb-5"><RuteroLogo href="/" size="md" /></div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-brand-300">Nueva empresa</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight text-white xl:text-5xl">Configura la operacion desde el primer acceso.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            Cada empresa queda separada por datos, moneda, pais, usuarios, clientes, rutas y prestamos.
          </p>
        </div>
        <div className="grid gap-2 border-t border-white/10 pt-5 text-sm">
          {["Moneda y metodos de pago por pais", "Admin crea cobradores y supervisores", "Clientes con documentos y GPS", "Prestamos con recaudo diario"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-carbon-950 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <span className="font-semibold text-white">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-xl flex-col justify-center">
        <div className="rounded-xl border border-white/10 bg-carbon-900 p-5 shadow-app sm:p-6">
          <RuteroLogo href="/" size="sm" className="mb-8 lg:hidden" />
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">Crear empresa</h1>
          <p className="mt-2 text-sm text-zinc-400">Registra la empresa y el primer usuario administrador.</p>
          {error ? <p className="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{decodeURIComponent(error)}</p> : null}
          <RegisterForm countries={supportedCountries} />
          <p className="mt-6 text-sm text-zinc-400">
            Ya tienes cuenta? <Link href="/login" className="font-semibold text-brand-400 hover:text-brand-300">Inicia sesion</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
