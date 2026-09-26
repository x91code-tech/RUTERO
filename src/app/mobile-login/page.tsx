import { Smartphone } from "lucide-react";
import { MobileLoginForm } from "@/components/auth/mobile-login-form";
import { RuteroLogo } from "@/components/brand/rutero-logo";

export default async function MobileLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <main className="min-h-screen bg-carbon-950 px-4 py-5 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-6 lg:px-8">
      <section className="hidden min-h-[calc(100vh-2.5rem)] flex-col justify-between rounded-xl border border-white/10 bg-carbon-900 p-7 lg:flex">
        <div className="border-b border-white/10 pb-5"><RuteroLogo href="/" size="md" /></div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-brand-300">Modo cobrador</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight text-white xl:text-5xl">Acceso rapido para ruta y caja.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            El cobrador inicia una primera vez con correo y contrasena. Luego este telefono queda vinculado y entra solo con PIN.
          </p>
        </div>
        <div className="grid border-t border-white/10 pt-5 text-sm sm:grid-cols-3">
          <div className="py-3 sm:border-r sm:border-white/10 sm:pr-4"><p className="text-xs font-bold uppercase text-zinc-500">PIN</p><p className="mt-1 font-black text-white">4 numeros</p></div>
          <div className="py-3 sm:border-r sm:border-white/10 sm:px-4"><p className="text-xs font-bold uppercase text-zinc-500">Ruta</p><p className="mt-1 font-black text-white">Asignada</p></div>
          <div className="py-3 sm:pl-4"><p className="text-xs font-bold uppercase text-zinc-500">Caja</p><p className="mt-1 font-black text-white">Diaria</p></div>
        </div>
      </section>

      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-xl border border-white/10 bg-carbon-900 p-5 shadow-app sm:p-6">
          <RuteroLogo href="/" size="sm" className="mb-8 lg:hidden" />
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Smartphone className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">Acceso de cobrador</h1>
          <p className="mt-2 text-sm text-zinc-400">Despues de vincular este telefono, usa tu identificador y PIN de 4 numeros.</p>
          <MobileLoginForm nextPath={next} />
        </div>
      </section>
    </main>
  );
}
