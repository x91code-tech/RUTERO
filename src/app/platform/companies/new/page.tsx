import { TenantCreateForm } from "@/components/platform/tenant-create-form";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { getPlatformDashboardData } from "@/lib/platform-data";
import { createPlatformCompanyAction } from "@/server/actions/platform-actions";

export default async function NewPlatformCompanyPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const [{ partners, plans }, params] = await Promise.all([
    getPlatformDashboardData(),
    searchParams
  ]);
  const activePlans = plans.filter((plan) => plan.active && plan.type !== "PARTNER" && Number(plan.monthlyPrice) > 0);
  const activePartners = partners.filter((partner) => partner.active);

  return (
    <AppShell title="Nueva empresa" subtitle="Crea una cuenta cliente y asigna plan, administrador y socio referido.">
      {params.error ? <Feedback message={errorMessage(params.error)} error /> : null}
      {params.created === "company" ? <Feedback message="La cuenta quedo creada. Comunica las credenciales iniciales por un canal seguro." /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,42rem)_minmax(18rem,1fr)]">
        <Card>
          <CardHeader title="Datos de la empresa" description="Esta alta crea la empresa, su administrador inicial y su contrato comercial." />
          <TenantCreateForm
            action={createPlatformCompanyAction}
            plans={activePlans}
            partnerOptions={activePartners.map((partner) => ({ id: partner.id, name: partner.user.name }))}
            includePartner
            submitLabel="Crear cuenta de empresa"
          />
          {!activePlans.length ? <p className="mt-3 text-xs text-amber-200">Activa un plan individual o de empresas antes de crear cuentas.</p> : null}
        </Card>

        <Card>
          <CardHeader title="Referido" description="Si la venta pertenece a un socio, seleccionalo en el formulario." />
          <div className="grid gap-3 text-sm text-zinc-400">
            <p>Las empresas creadas aqui quedan bajo control de RUTERO y pueden asociarse a un socio para calcular comisiones.</p>
            <p>El socio no ve clientes, prestamos ni caja de la empresa; solo sus datos comerciales y comisiones.</p>
            <p className="rounded-xl border border-white/10 bg-carbon-950 p-3 text-zinc-300">Socios activos disponibles: <strong className="text-white">{activePartners.length}</strong></p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Feedback({ message, error = false }: { message: string; error?: boolean }) {
  return <p role="status" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-500/20 bg-rose-500/10 text-rose-200" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"}`}>{message}</p>;
}

function errorMessage(code: string) {
  const messages: Record<string, string> = {
    "invalid-company": "Completa los datos y selecciona un plan valido. La contrasena inicial debe tener al menos 10 caracteres.",
    "partner-limit": "El socio seleccionado ya alcanzo su limite de empresas.",
    price: "Configura primero un precio mensual positivo para ese plan.",
    partner: "El socio seleccionado no esta activo.",
    email: "Ese correo ya esta registrado."
  };
  return messages[code] ?? "No se pudo crear la empresa.";
}
