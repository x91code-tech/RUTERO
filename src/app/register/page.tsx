import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { supportedCountries } from "@/lib/countries";
import { registerCompanyAction } from "@/server/actions/auth-actions";

const errorMessages: Record<string, string> = {
  invalid: "Revisa los datos de la empresa y del administrador.",
  email: "Ese correo ya está registrado."
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="surface w-full max-w-xl rounded-2xl p-6">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 font-black text-carbon-950">R</span>
          <span className="font-bold">RUTERO</span>
        </Link>
        <h1 className="text-2xl font-black">Crear empresa</h1>
        <p className="mt-2 text-sm text-zinc-400">Registra tu empresa y crea el primer usuario administrador.</p>
        {error ? <p className="mt-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{errorMessages[error] ?? "No se pudo crear la empresa."}</p> : null}
        <form action={registerCompanyAction} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre de empresa"><Input name="companyName" placeholder="Mi empresa" /></Field>
          <Field label="RIF o documento"><Input name="rif" placeholder="J-00000000-0" /></Field>
          <Field label="País">
            <Select name="countryCode" defaultValue="VE">
              {supportedCountries.map((country) => (
                <option key={country.countryCode} value={country.countryCode}>
                  {country.countryName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Moneda">
            <Select name="currencyCode" defaultValue="VES">
              {supportedCountries.map((country) => (
                <option key={`${country.countryCode}-${country.currencyCode}`} value={country.currencyCode}>
                  {country.currencyCode} · {country.currencyName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nombre del admin"><Input name="adminName" placeholder="Tu nombre" /></Field>
          <Field label="Correo"><Input name="email" type="email" placeholder="admin@empresa.com" /></Field>
          <Field label="Contraseña"><Input name="password" type="password" placeholder="Mínimo 8 caracteres" /></Field>
          <Button type="submit" className="sm:col-span-2"><Building2 className="h-4 w-4" /> Crear empresa</Button>
        </form>
      </section>
    </main>
  );
}
