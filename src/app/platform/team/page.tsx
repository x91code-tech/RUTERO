import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { roleLabel } from "@/lib/roles";
import { requirePlatformOwner } from "@/lib/platform-data";

export default async function PlatformTeamPage() {
  await requirePlatformOwner();
  const users = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "PARTNER"] } },
    include: { company: { select: { name: true, accountType: true } } },
    orderBy: [{ role: "asc" }, { name: "asc" }]
  });

  return (
    <AppShell title="Equipo RUTERO" subtitle="Usuarios internos, propietario de plataforma y socios con acceso comercial.">
      <Card>
        <CardHeader title="Accesos administrativos" description="Vista de control. Las altas internas se deben agregar con flujo auditado." />
        <div className="grid gap-3">
          {users.map((user) => (
            <article key={user.id} className="grid gap-3 rounded-xl border border-white/10 bg-carbon-950 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <h3 className="truncate font-bold text-white">{user.name}</h3>
                <p className="mt-1 truncate text-sm text-zinc-400">{user.email}</p>
                <p className="mt-1 text-xs text-zinc-500">{user.company.name} · {user.company.accountType}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <StatusBadge tone={user.active ? "green" : "red"}>{user.active ? "Activo" : "Inactivo"}</StatusBadge>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">{roleLabel(user.role)}</span>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
