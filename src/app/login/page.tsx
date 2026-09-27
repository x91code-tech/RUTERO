import { ShieldCheck } from "lucide-react";
import { CollectorLoginRedirect } from "@/components/auth/collector-login-redirect";
import { LoginForm } from "@/components/auth/login-form";
import { LoginExperience } from "@/components/auth/login-experience";
import { RuteroLogo } from "@/components/brand/rutero-logo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;

  return (
    <LoginExperience
      intro={
        <section className="login-welcome overflow-hidden rounded-3xl border border-white/10 bg-carbon-900/85 p-5 shadow-panel sm:p-7 xl:p-10">
          <div className="login-welcome-header flex items-center justify-between">
            <RuteroLogo href="/" size="md" />
            <span className="text-xs font-medium tracking-wide text-zinc-500">Hecho para avanzar</span>
          </div>
          <div className="login-welcome-content">
            <div className="login-route-scene" aria-hidden="true">
              <div className="login-route-label">
                <span className="login-route-pulse" />
                <span>Un nuevo día comienza</span>
              </div>
              <svg className="login-route-map" viewBox="0 0 660 290" fill="none">
                <path className="login-route-glow" d="M45 205C111 177 122 91 202 112C271 130 302 199 360 153C414 111 432 76 510 99C567 116 570 158 615 55" />
                <path className="login-route-line" d="M45 205C111 177 122 91 202 112C271 130 302 199 360 153C414 111 432 76 510 99C567 116 570 158 615 55" />
                <circle className="login-route-stop" cx="45" cy="205" r="7" />
                <circle className="login-route-stop" cx="202" cy="112" r="7" />
                <circle className="login-route-stop" cx="360" cy="153" r="7" />
                <circle className="login-route-stop" cx="510" cy="99" r="7" />
                <circle className="login-route-stop login-route-stop-end" cx="615" cy="55" r="9" />
              </svg>
              <span className="login-route-marker" />
              <div className="login-route-caption">
                <span>Empieza aquí</span>
                <span className="login-route-caption-line" />
                <span>Sigue adelante</span>
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-300">RUTERO</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-black leading-[1.08] tracking-[-0.06em] text-white xl:text-5xl">
              Que cada día te lleve más lejos.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
              Da el siguiente paso con confianza. Nos alegra tenerte aquí.
            </p>
          </div>
          <p className="login-welcome-footer mt-auto border-t border-white/[0.07] pt-4 text-xs tracking-wide text-zinc-500">
            Avanza a tu ritmo. Lo importante es seguir.
          </p>
        </section>
      }
    >
      <CollectorLoginRedirect />
      <section className="login-form-section mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="login-form-card rounded-3xl border border-white/10 bg-carbon-900/85 p-5 shadow-panel sm:p-7">
          <RuteroLogo href="/" size="sm" className="login-card-brand mb-7" />
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-[-0.05em]">Qué bueno tenerte de vuelta</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Inicia sesión para continuar. Los cobradores pueden entrar con su PIN.</p>
          {error ? <p className="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{decodeURIComponent(error)}</p> : null}
          <LoginForm nextPath={next} />
          <div className="mt-5 flex justify-end border-t border-white/10 pt-4 text-sm text-zinc-400">
            <a href="/mobile-login" className="font-semibold text-brand-400 hover:text-brand-300">Acceso cobrador</a>
          </div>
        </div>
      </section>
    </LoginExperience>
  );
}
