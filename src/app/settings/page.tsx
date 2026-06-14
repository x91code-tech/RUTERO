import { AppShell } from "@/components/layout/app-shell";
import { CompanySettingsForm } from "@/components/forms/company-settings-form";
import { UserForm } from "@/components/forms/user-form";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClientsPageData } from "@/lib/clients-data";
import { supportedCountries } from "@/lib/countries";
import { formatCurrency } from "@/lib/formatters";
import { roleDescription, roleLabel, roleTone } from "@/lib/roles";

const errorMessages: Record<string, string> = {
  permission: "No tienes permiso para crear usuarios.",
  user_exists: "Ya existe un usuario con ese correo."
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { company, users } = await getClientsPageData();

  return (
    <AppShell title="Configuracion" subtitle="Empresa, cobradores, roles y permisos operativos.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Empresa" description="Datos generales de la cuenta SaaS." />
          <CompanySettingsForm company={company} countries={supportedCountries} />
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-zinc-400">Vista previa de moneda</p>
            <p className="mt-2 text-2xl font-black">{formatCurrency(1535, company)}</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Usuarios y permisos" description="Crea administradores, supervisores y cobradores." />
          {error ? <p className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{errorMessages[error] ?? "No se pudo completar la accion."}</p> : null}
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <h3 className="mb-4 font-bold">Crear usuario</h3>
            <UserForm />
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] p-4">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-zinc-400">{user.email}</p>
                  <p className="mt-1 text-xs text-zinc-500">{roleDescription(user.role)}</p>
                </div>
                <StatusBadge tone={roleTone(user.role)}>{roleLabel(user.role)}</StatusBadge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
