import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatShortDate } from "@/lib/formatters";
import { requirePlatformOwner } from "@/lib/platform-data";

export default async function PlatformAuditPage() {
  await requirePlatformOwner();
  const [auditLogs, notifications] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        company: { select: { name: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 80
    }),
    prisma.notification.findMany({
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ]);

  return (
    <AppShell title="Auditoria" subtitle="Eventos recientes, notificaciones y trazabilidad administrativa.">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <CardHeader title="Historial de acciones" description="Registros guardados por acciones críticas del sistema." />
          <div className="grid gap-3">
            {auditLogs.map((log) => (
              <article key={log.id} className="rounded-xl border border-white/10 bg-carbon-950 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">{log.action}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{log.entity} · {log.company.name}</p>
                  </div>
                  <span className="text-xs text-zinc-500">{formatShortDate(log.createdAt)}</span>
                </div>
                <p className="mt-3 text-xs text-zinc-500">Usuario: {log.user?.name ?? "Sistema"}{log.ip ? ` · IP ${log.ip}` : ""}</p>
              </article>
            ))}
            {!auditLogs.length ? <p className="rounded-xl border border-white/10 bg-carbon-950 p-4 text-sm text-zinc-500">Todavia no hay auditoria registrada. Las acciones nuevas pueden conectarse aqui progresivamente.</p> : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Alertas recientes" description="Notificaciones emitidas por empresas." />
          <div className="grid gap-3">
            {notifications.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/10 bg-carbon-950 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{item.company.name} · {item.severity}</p>
                <h3 className="mt-2 font-bold text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-5 text-zinc-400">{item.message}</p>
              </article>
            ))}
            {!notifications.length ? <p className="text-sm text-zinc-500">No hay notificaciones recientes.</p> : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
