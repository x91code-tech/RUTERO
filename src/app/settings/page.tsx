import { AppShell } from "@/components/layout/app-shell";
import { CompanySettingsForm } from "@/components/forms/company-settings-form";
import { UserForm } from "@/components/forms/user-form";
import { ReleaseCollectorDeviceForm } from "@/components/settings/release-collector-device-form";
import { ResetCollectorPinForm } from "@/components/settings/reset-collector-pin-form";
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
              <div key={user.id} className="grid gap-3 rounded-xl bg-white/[0.04] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-zinc-400">{user.email}</p>
                  <p className="mt-1 text-xs text-zinc-500">{roleDescription(user.role)}</p>
                  {user.role === "SELLER" ? (
                    <div className="mt-2 grid gap-1 text-xs text-zinc-400">
                      <p>Acceso telefono: <span className="font-mono text-zinc-100">{user.mobileIdentifier ?? "Sin generar"}</span></p>
                      <p>
                        Dispositivo:{" "}
                        <span className={user.mobileDeviceBoundAt ? "text-emerald-300" : "text-amber-300"}>
                          {user.mobileDeviceBoundAt ? "Vinculado" : "Sin vincular"}
                        </span>
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:justify-items-end">
                  <StatusBadge tone={roleTone(user.role)}>{roleLabel(user.role)}</StatusBadge>
                  {user.role === "SELLER" ? (
                    <div className="grid gap-2">
                      <ResetCollectorPinForm userId={user.id} hasMobileAccess={Boolean(user.mobileIdentifier)} />
                      <ReleaseCollectorDeviceForm userId={user.id} disabled={!user.mobileDeviceBoundAt} />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
