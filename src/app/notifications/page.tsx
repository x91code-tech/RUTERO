import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getNotificationsData } from "@/lib/notifications-data";
import { formatShortDate } from "@/lib/formatters";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/actions/notification-actions";

export default async function NotificationsPage() {
  const { notifications, unreadCount } = await getNotificationsData();

  return (
    <AppShell title="Notificaciones" subtitle="Alertas operativas de clientes, prestamos, recaudos y caja.">
      <Card>
        <CardHeader
          title={`${unreadCount} sin leer`}
          description="Las notificaciones se crean automaticamente con eventos importantes."
          action={
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="secondary"><CheckCheck className="h-4 w-4" /> Marcar todas</Button>
            </form>
          }
        />
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className={`rounded-xl border p-4 ${notification.readAt ? "border-white/10 bg-white/[0.03]" : "border-brand-500/30 bg-brand-500/10"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-brand-400">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold">{notification.title}</p>
                      <p className="text-xs text-zinc-500">{notification.createdAt ? formatShortDate(notification.createdAt) : "Reciente"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-zinc-300">{notification.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={notification.severity === "critical" ? "red" : notification.severity === "warning" ? "orange" : "green"}>
                    {notification.severity}
                  </StatusBadge>
                  {notification.readAt ? <StatusBadge>Leida</StatusBadge> : (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <Button type="submit" variant="ghost">Leer</Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}

          {notifications.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center text-zinc-400">
              Todavia no hay notificaciones.
            </div>
          ) : null}
        </div>
      </Card>
    </AppShell>
  );
}
