import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Bell, ClipboardList, CreditCard, Home, Landmark, LogOut, Map, Menu, Route, Settings, Shield, Users, WalletCards } from "lucide-react";
import { RuteroLogo } from "@/components/brand/rutero-logo";
import { getNotificationSummary } from "@/lib/notifications-data";
import { canRoleAccessPath, getDefaultPathForRole } from "@/lib/permissions";
import { roleLabel } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth-actions";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/seller", label: "Cobrador", icon: CreditCard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/routes", label: "Rutas", icon: Route },
  { href: "/loans", label: "Prestamos", icon: Landmark },
  { href: "/collections", label: "Recaudos", icon: WalletCards },
  { href: "/expenses", label: "Movimientos", icon: ClipboardList },
  { href: "/cashbox", label: "Caja diaria", icon: Shield },
  { href: "/reports", label: "Reportes", icon: Map },
  { href: "/notifications", label: "Notificaciones", icon: Bell },
  { href: "/settings", label: "Configuracion", icon: Settings }
];

const quickActions = [
  { href: "/clients", label: "Cliente", icon: Users },
  { href: "/loans", label: "Prestamo", icon: Landmark },
  { href: "/collections", label: "Recaudo", icon: WalletCards },
  { href: "/expenses", label: "Movimiento", icon: ClipboardList },
  { href: "/cashbox", label: "Caja", icon: Shield }
];

export async function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const headerStore = await headers();
  const homeHref = getDefaultPathForRole(user.role);
  const currentPath = headerStore.get("x-rutero-pathname") ?? homeHref;
  if (!canRoleAccessPath(user.role, currentPath)) redirect(homeHref);

  const allowedNavigation = navigation.filter((item) => canRoleAccessPath(user.role, item.href));
  const allowedQuickActions = quickActions.filter((item) => canRoleAccessPath(user.role, item.href));
  const bottomNavigation = allowedNavigation
    .filter((item) => ["/dashboard", "/seller", "/clients", "/loans", "/cashbox"].includes(item.href))
    .slice(0, 5);
  const { unreadCount } = await getNotificationSummary();

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/10 bg-carbon-950/75 p-5 shadow-app backdrop-blur-xl lg:block">
        <RuteroLogo href={homeHref} size="sm" className="mb-8" aria-label="Ir al inicio" />
        <nav className="grid gap-1">
          {allowedNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                  isActive ? "bg-brand-500 text-white shadow-glow" : "text-zinc-300 hover:bg-white/[0.07] hover:text-white"
                )}
                href={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 max-w-full overflow-x-hidden">
        <header className="sticky top-0 z-20 max-w-full overflow-x-hidden border-b border-white/10 bg-carbon-950/82 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-8 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            <RuteroLogo href={homeHref} size="sm" showText={false} className="lg:hidden" aria-label="Ir al inicio" />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-normal sm:text-2xl">{title}</h1>
              <p className="truncate text-xs text-zinc-400 sm:text-sm">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right text-sm md:block">
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-xs text-zinc-500">{roleLabel(user.role)}</p>
              </div>
              <div className="hidden rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300 sm:block">En linea</div>
              <Link href="/notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.07] transition hover:bg-white/[0.11] sm:h-11 sm:w-11" aria-label="Ver notificaciones">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent-400 px-1 text-xs font-black text-carbon-950">{unreadCount}</span>
                ) : null}
              </Link>
              <form action={logoutAction}>
                <button className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-zinc-200 transition hover:bg-white/[0.11] sm:h-11 sm:w-11" aria-label="Cerrar sesion">
                  <LogOut className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
          {allowedQuickActions.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {allowedQuickActions.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition",
                      isActive ? "border-brand-500 bg-brand-500 text-white shadow-glow" : "border-white/10 bg-white/[0.045] text-zinc-200 hover:bg-white/[0.08]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
          <details className="group mt-3 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-200">
              <span className="inline-flex items-center gap-2">
                <Menu className="h-4 w-4" />
                Menu
              </span>
              <span className="text-xs text-zinc-500">{allowedNavigation.length} opciones</span>
            </summary>
            <nav className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allowedNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      isActive ? "border-brand-500 bg-brand-500 text-white" : "border-white/10 bg-white/[0.04] text-zinc-300"
                    )}
                    href={item.href}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-brand-400")} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </details>
        </header>
        <main className="min-w-0 max-w-full overflow-x-hidden px-3 pb-28 pt-4 sm:px-5 lg:px-8 lg:py-6">{children}</main>
        {bottomNavigation.length > 0 ? (
          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-carbon-950/90 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 shadow-app backdrop-blur-xl lg:hidden">
            <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
              {bottomNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "grid min-h-[3.65rem] place-items-center rounded-2xl px-1 py-1 text-[0.66rem] font-black transition",
                      isActive ? "bg-brand-500 text-white shadow-glow" : "text-zinc-400 active:bg-white/[0.08]"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="mt-0.5 max-w-full truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
