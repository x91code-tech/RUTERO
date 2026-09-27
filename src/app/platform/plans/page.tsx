import { AppShell } from "@/components/layout/app-shell";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";
import { ensurePlatformDefaults, requirePlatformOwner } from "@/lib/platform-data";
import { updatePlatformPlanAction } from "@/server/actions/platform-actions";

const typeLabels = {
  INDIVIDUAL: "Individual",
  BUSINESS: "Empresas",
  PARTNER: "Socios"
};

export default async function PlatformPlansPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePlatformOwner();
  const [params] = await Promise.all([searchParams, ensurePlatformDefaults()]);
  const plans = await prisma.platformPlan.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });

  return (
    <AppShell title="Planes de RUTERO" subtitle="Precios mensuales, moneda y limites que se aplican al crear nuevas suscripciones.">
      <div className="mb-4"><LinkButton href="/platform" variant="secondary">Volver a empresas</LinkButton></div>
      {params.error ? <p role="status" className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{planError(params.error)}</p> : null}
      {params.saved ? <p role="status" className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Plan guardado.</p> : null}
      <div className="grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader title={plan.name} description={typeLabels[plan.type]} />
            <form action={updatePlatformPlanAction} className="grid gap-3">
              <input type="hidden" name="id" value={plan.id} />
              <div className="grid grid-cols-[1fr_6rem] gap-3">
                <Field label="Precio mensual"><Input name="monthlyPrice" type="number" min="0.00000001" step="0.00000001" defaultValue={Number(plan.monthlyPrice) || ""} required /></Field>
                <Field label="Moneda"><Input name="currencyCode" minLength={2} maxLength={10} defaultValue={plan.currencyCode} required /></Field>
              </div>
              <Field label="Máximo de usuarios"><Input name="maxUsers" type="number" min="1" step="1" defaultValue={plan.maxUsers} required /></Field>
              <Field label="Máximo de cobradores"><Input name="maxSellers" type="number" min="0" step="1" defaultValue={plan.maxSellers} required /></Field>
              {plan.type === "PARTNER" ? <Field label="Máximo de empresas referidas"><Input name="maxCompanies" type="number" min="1" step="1" defaultValue={plan.maxCompanies} required /></Field> : <input type="hidden" name="maxCompanies" value="0" />}
              <p className="text-xs leading-5 text-zinc-500">Cambiar un plan afecta nuevas cuentas. Las suscripciones existentes conseraan su precio y limites acordados.</p>
              <Button type="submit" variant="secondary">Guardar plan</Button>
            </form>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function planError(code: string) {
  if (code === "price") return "Configura primero un precio mensual positivo para ese plan.";
  return "Revisa el precio, la moneda y los limites del plan.";
}
