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

export async function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const headerStore = await headers();
  const homeHref = getDefaultPathForRole(user.role);
  const currentPath = headerStore.get("x-rutero-pathname") ?? homeHref;
  if (!canRoleAccessPath(user.role, currentPath)) redirect(homeHref);

  const allowedNavigation = navigation.filter((item) => canRoleAccessPath(user.role, item.href));
  const bottomNavigation = allowedNavigation
    .filter((item) => ["/dashboard", "/seller", "/clients", "/loans", "/cashbox"].includes(item.href))
    .slice(0, 5);
  const { unreadCount } = await getNotificationSummary();

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-carbon-950 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/[0.07] bg-[#11100e] px-3 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <RuteroLogo href={homeHref} size="sm" className="mb-6 border-b border-white/[0.08] px-2 pb-5" aria-label="Ir al inicio" />
        <p className="mb-2 px-3 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-zinc-600">Espacio de trabajo</p>
        <nav className="grid gap-1">
          {allowedNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.82rem] font-semibold transition-colors",
                  isActive ? "bg-white/[0.07] text-white before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[2px] before:bg-brand-400" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                )}
                href={item.href}
              >
                <Icon className={cn("h-[1.05rem] w-[1.05rem]", isActive ? "text-brand-300" : "text-zinc-600")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/[0.08] px-3 pt-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-zinc-600">Operaciones</p>
          <p className="mt-1 text-xs text-zinc-500">Cartera, ruta y caja</p>
        </div>
      </aside>
      <div className="min-w-0 max-w-full overflow-x-hidden">
        <header className="sticky top-0 z-20 max-w-full overflow-x-hidden border-b border-white/[0.07] bg-carbon-950/95 px-2.5 py-2 sm:px-5 sm:py-3 lg:px-8 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            <RuteroLogo href={homeHref} size="sm" showText={false} className="lg:hidden" aria-label="Ir al inicio" />
            <div className="min-w-0">
              <p className="mb-0.5 hidden text-[0.58rem] font-bold uppercase tracking-[0.2em] text-brand-300 lg:block">RUTERO <span className="px-1 text-zinc-700">/</span> OPERACIONES</p>
              <h1 className="truncate text-lg font-bold tracking-[-0.04em] text-white sm:text-2xl">{title}</h1>
              <p className="truncate text-xs text-zinc-500 sm:text-sm">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right text-sm md:block">
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-xs text-zinc-500">{roleLabel(user.role)}</p>
              </div>
              <div className="hidden items-center gap-1.5 text-[0.68rem] font-medium text-zinc-500 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> En linea</div>
              <Link href="/notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-carbon-900 transition hover:bg-carbon-850 sm:h-11 sm:w-11 sm:rounded-xl" aria-label="Ver notificaciones">
                <Bell className="h-[1.1rem] w-[1.1rem]" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-xs font-black text-white">{unreadCount}</span>
                ) : null}
              </Link>
              <form action={logoutAction}>
                <button className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-carbon-900 text-zinc-200 transition hover:bg-carbon-850 sm:h-11 sm:w-11 sm:rounded-xl" aria-label="Cerrar sesion">
                  <LogOut className="h-[1.1rem] w-[1.1rem]" />
                </button>
              </form>
            </div>
          </div>
          <details className="group mt-2 lg:hidden">
            <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between rounded-lg border border-white/10 bg-carbon-900 px-3 py-1.5 text-xs font-semibold text-zinc-200">
              <span className="inline-flex items-center gap-2">
                <Menu className="h-3.5 w-3.5" />
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
                      "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition",
                      isActive ? "border-brand-500 bg-brand-500 text-white shadow-glow" : "border-white/10 bg-carbon-900 text-zinc-300"
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
        <main className="min-w-0 max-w-full overflow-x-hidden px-2.5 pb-20 pt-3 sm:px-5 sm:pb-24 sm:pt-4 lg:px-7 lg:py-6">{children}</main>
        {bottomNavigation.length > 0 ? (
          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-carbon-900/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-1 shadow-panel backdrop-blur-lg lg:hidden">
            <div className="grid w-full max-w-none grid-cols-[repeat(5,minmax(0,1fr))] gap-0">
              {bottomNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative grid min-h-12 place-items-center rounded-lg px-0.5 py-0.5 text-[0.59rem] font-semibold transition",
                      isActive ? "text-brand-200 before:absolute before:inset-x-3 before:top-0 before:h-[2px] before:bg-brand-400" : "text-zinc-500 active:bg-carbon-850"
                    )}
                  >
                    <Icon className="h-[1.1rem] w-[1.1rem]" />
                    <span className="max-w-full truncate leading-none">{item.label}</span>
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
