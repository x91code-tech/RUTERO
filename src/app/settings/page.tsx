import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { demoCompany, demoUsers } from "@/lib/demo-data";
import { supportedCountries } from "@/lib/countries";
import { formatCurrency } from "@/lib/formatters";

export default function SettingsPage() {
  return (
    <AppShell title="Configuración" subtitle="Empresa, usuarios, roles y permisos operativos.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Empresa" description="Datos generales de la cuenta SaaS." />
          <form className="grid gap-4">
            <Field label="Nombre"><Input defaultValue={demoCompany.name} /></Field>
            <Field label="RIF"><Input defaultValue={demoCompany.rif} /></Field>
            <Field label="País de operación">
              <Select defaultValue={demoCompany.countryCode}>
                {supportedCountries.map((country) => (
                  <option key={country.countryCode} value={country.countryCode}>
                    {country.countryName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Moneda principal">
              <Select defaultValue={demoCompany.currencyCode}>
                {supportedCountries.map((country) => (
                  <option key={`${country.countryCode}-${country.currencyCode}`} value={country.currencyCode}>
                    {country.currencyCode} · {country.currencyName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Formato regional"><Input defaultValue={demoCompany.locale} /></Field>
            <Field label="Zona horaria"><Input defaultValue={demoCompany.timeZone} /></Field>
            <Field label="Plan"><Select defaultValue={demoCompany.plan}><option>PRO</option><option>ENTERPRISE</option></Select></Field>
          </form>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-zinc-400">Vista previa de moneda</p>
            <p className="mt-2 text-2xl font-black">{formatCurrency(1535, demoCompany)}</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Usuarios y permisos" description="SUPER_ADMIN, ADMIN, SUPERVISOR y SELLER." />
          <div className="space-y-3">
            {demoUsers.map((user) => (
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
