import Link from "next/link";
import { Smartphone } from "lucide-react";
import { MobileLoginForm } from "@/components/auth/mobile-login-form";
import { RuteroLogo } from "@/components/brand/rutero-logo";

export default async function MobileLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <main className="grid min-h-screen bg-carbon-950 px-5 py-8 lg:grid-cols-[1fr_28rem] lg:px-8">
      <section className="hidden min-h-[calc(100vh-4rem)] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-8 lg:flex">
        <RuteroLogo href="/" size="md" />
        <div>
          <p className="max-w-2xl text-5xl font-black leading-tight text-white">Acceso seguro para cobradores en ruta.</p>
          <p className="mt-5 max-w-xl text-zinc-400">
            El cobrador inicia una primera vez con correo y contrasena. Luego este telefono queda vinculado y entra solo con PIN.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-carbon-900/80 p-4"><p className="text-zinc-500">PIN</p><p className="mt-1 font-bold text-white">4 numeros</p></div>
          <div className="rounded-xl bg-carbon-900/80 p-4"><p className="text-zinc-500">Ruta</p><p className="mt-1 font-bold text-white">Solo cobrador</p></div>
          <div className="rounded-xl bg-carbon-900/80 p-4"><p className="text-zinc-500">Caja</p><p className="mt-1 font-bold text-white">Diaria</p></div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center lg:pl-8">
        <div className="surface rounded-2xl p-6">
          <RuteroLogo href="/" size="sm" className="mb-8 lg:hidden" />
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-carbon-950">
            <Smartphone className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">Acceso de cobrador</h1>
          <p className="mt-2 text-sm text-zinc-400">Despues de vincular este telefono, usa tu identificador y PIN de 4 numeros.</p>
          <MobileLoginForm nextPath={next} />
          <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
            <Link href="/login?force=email" className="font-semibold text-brand-400 hover:text-brand-300">Entrar con correo</Link>
            <span>Primer acceso: correo</span>
          </div>
        </div>
      </section>
    </main>
  );
}
