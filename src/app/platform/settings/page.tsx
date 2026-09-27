import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { getPlatformDashboardData } from "@/lib/platform-data";
import { updateGracePeriodAction } from "@/server/actions/platform-actions";

export default async function PlatformSettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [{ settings, summary }, params] = await Promise.all([
    getPlatformDashboardData(),
    searchParams
  ]);

  return (
    <AppShell title="Ajustes plataforma" subtitle="Reglas comerciales generales para cuentas, vencimientos y acceso.">
      {params.error ? <Feedback message={errorMessage(params.error)} error /> : null}
      {params.saved ? <Feedback message="Configuracion guardada." /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,36rem)_minmax(18rem,1fr)]">
        <Card>
          <CardHeader
            title="Periodo de gracia"
            description="Dias que una empresa o socio puede seguir usando RUTERO despues del vencimiento."
          />
          <form action={updateGracePeriodAction} className="grid gap-4">
            <Field label="Dias de gracia" hint="Usa 0 para suspender apenas vence; maximo 30 dias.">
              <Input name="gracePeriodDays" type="number" min="0" max="30" defaultValue={settings.gracePeriodDays} required />
            </Field>
            <Button type="submit" className="w-full sm:w-auto">Guardar ajustes</Button>
          </form>
        </Card>

        <Card>
          <CardHeader title="Impacto actual" description="Resumen de cuentas que dependen de esta regla." />
          <div className="grid gap-3">
            <ImpactRow label="Empresas por cobrar" value={summary.dueSoon} />
            <ImpactRow label="Empresas suspendidas" value={summary.suspended} />
            <ImpactRow label="Socios por cobrar" value={summary.partnerDueSoon} />
            <ImpactRow label="Socios suspendidos" value={summary.partnerSuspended} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function ImpactRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-carbon-950 px-4 py-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <strong className="text-lg tabular-nums text-white">{value}</strong>
    </div>
  );
}

function Feedback({ message, error = false }: { message: string; error?: boolean }) {
  return <p role="status" className={`mb-4 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-500/20 bg-rose-500/10 text-rose-200" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"}`}>{message}</p>;
}

function errorMessage(code: string) {
  const messages: Record<string, string> = {
    grace: "El periodo de gracia debe estar entre 0 y 30 dias."
  };
  return messages[code] ?? "No se pudo guardar la configuracion.";
}
