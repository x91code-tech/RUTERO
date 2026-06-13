import Link from "next/link";
import { Building2 } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { supportedCountries } from "@/lib/countries";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="surface w-full max-w-xl rounded-2xl p-6">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 font-black text-carbon-950">R</span>
          <span className="font-bold">RUTERO</span>
        </Link>
        <h1 className="text-2xl font-black">Crear empresa</h1>
        <p className="mt-2 text-sm text-zinc-400">Registra tu empresa y crea el primer usuario administrador.</p>
        <form className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre de empresa"><Input placeholder="Mi empresa" /></Field>
          <Field label="RIF o documento"><Input placeholder="J-00000000-0" /></Field>
          <Field label="País">
            <Select defaultValue="VE">
              {supportedCountries.map((country) => (
                <option key={country.countryCode} value={country.countryCode}>
                  {country.countryName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Moneda">
            <Select defaultValue="VES">
              {supportedCountries.map((country) => (
                <option key={`${country.countryCode}-${country.currencyCode}`} value={country.currencyCode}>
                  {country.currencyCode} · {country.currencyName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nombre del admin"><Input placeholder="Tu nombre" /></Field>
          <Field label="Correo"><Input type="email" placeholder="admin@empresa.com" /></Field>
          <Field label="Contraseña"><Input type="password" placeholder="Mínimo 8 caracteres" /></Field>
          <LinkButton href="/dashboard" className="sm:col-span-2"><Building2 className="h-4 w-4" /> Crear empresa</LinkButton>
        </form>
      </section>
    </main>
  );
}
