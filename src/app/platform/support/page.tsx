import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requirePlatformOwner } from "@/lib/platform-data";

export default async function PlatformSupportPage() {
  await requirePlatformOwner();
  const [companiesWithoutAdmin, suspendedCompanies, criticalNotifications] = await Promise.all([
    prisma.company.findMany({
      where: { accountType: "CUSTOMER", users: { none: { role: "ADMIN", active: true } } },
      select: { id: true, name: true },
      take: 20
    }),
    prisma.company.findMany({
      where: { accountType: "CUSTOMER", subscription: { active: false } },
      select: { id: true, name: true },
      take: 20
    }),
    prisma.notification.findMany({
      where: { severity: { in: ["warning", "critical"] } },
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return (
    <AppShell title="Soporte" subtitle="Casos que requieren revision manual del propietario o del equipo RUTERO.">
      <div className="grid gap-5 xl:grid-cols-3">
        <SupportPanel title="Sin administrador activo" rows={companiesWithoutAdmin.map((company) => company.name)} empty="Todas las empresas tienen admin activo." />
        <SupportPanel title="Suspendidas manualmente" rows={suspendedCompanies.map((company) => company.name)} empty="No hay empresas suspendidas manualmente." />
        <Card>
          <CardHeader title="Alertas de empresas" description="Notificaciones warning/critical recientes." />
          <div className="grid gap-3">
            {criticalNotifications.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-carbon-950 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{item.company.name} · {item.severity}</p>
                <h3 className="mt-2 font-bold text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{item.message}</p>
              </article>
            ))}
            {!criticalNotifications.length ? <p className="text-sm text-zinc-500">No hay alertas recientes.</p> : null}
          </div>
        </Card>
      </div>
      <Card className="mt-5">
        <CardHeader title="Accesos rapidos de soporte" description="Rutas frecuentes para resolver casos." />
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-xl border border-white/10 bg-carbon-850 px-4 py-2 text-sm font-semibold text-zinc-200" href="/platform/companies">Empresas</Link>
          <Link className="rounded-xl border border-white/10 bg-carbon-850 px-4 py-2 text-sm font-semibold text-zinc-200" href="/platform/payments">Pagos</Link>
          <Link className="rounded-xl border border-white/10 bg-carbon-850 px-4 py-2 text-sm font-semibold text-zinc-200" href="/platform/audit">Auditoria</Link>
        </div>
      </Card>
    </AppShell>
  );
}

function SupportPanel({ empty, rows, title }: { empty: string; rows: string[]; title: string }) {
  return (
    <Card>
      <CardHeader title={title} description="Requiere seguimiento." />
      <div className="grid gap-2">
        {rows.map((row) => <div key={row} className="rounded-xl border border-white/10 bg-carbon-950 px-4 py-3 text-sm font-semibold text-white">{row}</div>)}
        {!rows.length ? <p className="text-sm text-zinc-500">{empty}</p> : null}
      </div>
    </Card>
  );
}
