import { AppShell } from "@/components/layout/app-shell";
import { UserForm } from "@/components/forms/user-form";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClientsPageData } from "@/lib/clients-data";
import { supportedCountries } from "@/lib/countries";
import { formatCurrency } from "@/lib/formatters";

const errorMessages: Record<string, string> = {
  permission: "No tienes permiso para crear usuarios.",
  user_exists: "Ya existe un usuario con ese correo."
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { company, users } = await getClientsPageData();

  return (
    <AppShell title="Configuración" subtitle="Empresa, usuarios, roles y permisos operativos.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Empresa" description="Datos generales de la cuenta SaaS." />
          <form className="grid gap-4">
            <Field label="Nombre"><Input defaultValue={company.name} /></Field>
            <Field label="RIF"><Input defaultValue={company.rif} /></Field>
            <Field label="País de operación">
              <Select defaultValue={company.countryCode}>
                {supportedCountries.map((country) => (
                  <option key={country.countryCode} value={country.countryCode}>
                    {country.countryName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Moneda principal">
              <Select defaultValue={company.currencyCode}>
                {supportedCountries.map((country) => (
                  <option key={`${country.countryCode}-${country.currencyCode}`} value={country.currencyCode}>
                    {country.currencyCode} · {country.currencyName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Formato regional"><Input defaultValue={company.locale} /></Field>
            <Field label="Zona horaria"><Input defaultValue={company.timeZone} /></Field>
            <Field label="Plan"><Select defaultValue={company.plan}><option>PRO</option><option>ENTERPRISE</option></Select></Field>
          </form>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-zinc-400">Vista previa de moneda</p>
            <p className="mt-2 text-2xl font-black">{formatCurrency(1535, company)}</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Usuarios y permisos" description="SUPER_ADMIN, ADMIN, SUPERVISOR y SELLER." />
          {error ? <p className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{errorMessages[error] ?? "No se pudo completar la acción."}</p> : null}
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <h3 className="mb-4 font-bold">Crear usuario</h3>
            <UserForm />
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-4">
                <div><p className="font-semibold">{user.name}</p><p className="text-sm text-zinc-400">{user.email}</p></div>
                <StatusBadge tone={user.role === "ADMIN" ? "green" : user.role === "SELLER" ? "orange" : "blue"}>{user.role}</StatusBadge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
