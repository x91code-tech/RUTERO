import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { loginAction } from "@/server/actions/auth-actions";

const errorMessages: Record<string, string> = {
  invalid: "Revisa el correo y la contraseña.",
  credentials: "Correo o contraseña incorrectos."
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="surface w-full max-w-md rounded-2xl p-6">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 font-black text-carbon-950">R</span>
          <span className="font-bold">RUTERO</span>
        </Link>
        <h1 className="text-2xl font-black">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-zinc-400">Demo admin: admin@rutero.app · Admin123456</p>
        {error ? <p className="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{errorMessages[error] ?? "No se pudo iniciar sesión."}</p> : null}
        <form action={loginAction} className="mt-6 grid gap-4">
          <Field label="Correo"><Input name="email" type="email" defaultValue="admin@rutero.app" /></Field>
          <Field label="Contraseña"><Input name="password" type="password" defaultValue="Admin123456" /></Field>
          <Button type="submit"><LogIn className="h-4 w-4" /> Entrar al dashboard</Button>
        </form>
      </section>
    </main>
  );
}
