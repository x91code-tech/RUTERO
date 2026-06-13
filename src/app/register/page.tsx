import Link from "next/link";
import { Building2, CheckCircle2 } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { RuteroLogo } from "@/components/brand/rutero-logo";
import { supportedCountries } from "@/lib/countries";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen bg-carbon-950 px-5 py-8 lg:grid-cols-[1fr_34rem] lg:px-8">
      <section className="hidden min-h-[calc(100vh-4rem)] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-8 lg:flex">
        <RuteroLogo href="/" size="md" />
        <div>
          <p className="max-w-2xl text-5xl font-black leading-tight text-white">Crea una empresa lista para operar con vendedores.</p>
          <p className="mt-5 max-w-xl text-zinc-400">
            Cada empresa queda separada por datos, moneda, pais, usuarios, clientes, rutas y prestamos.
          </p>
        </div>
        <div className="grid gap-3 text-sm">
          {["Moneda y metodos de pago por pais", "Admin crea vendedores y supervisores", "Clientes con documentos y GPS", "Prestamos con cobro diario"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl bg-carbon-900/80 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <span className="font-semibold text-white">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-xl flex-col justify-center lg:pl-8">
        <div className="surface rounded-2xl p-6">
          <RuteroLogo href="/" size="sm" className="mb-8 lg:hidden" />
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-carbon-950">
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
