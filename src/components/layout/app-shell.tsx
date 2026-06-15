import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Bell, Boxes, ClipboardList, CreditCard, Home, Landmark, LogOut, Map, ReceiptText, Route, Settings, Shield, Users, WalletCards } from "lucide-react";
import { RuteroLogo } from "@/components/brand/rutero-logo";
import { getNotificationSummary } from "@/lib/notifications-data";
import { canRoleAccessPath, getDefaultPathForRole } from "@/lib/permissions";
import { roleLabel } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/server/actions/auth-actions";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/seller", label: "Cobrador", icon: CreditCard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/routes", label: "Rutas", icon: Route },
  { href: "/loans", label: "Prestamos", icon: Landmark },
  { href: "/sales", label: "Ventas", icon: ReceiptText },
  { href: "/collections", label: "Recaudos", icon: WalletCards },
  { href: "/expenses", label: "Movimientos", icon: ClipboardList },
  { href: "/cashbox", label: "Caja diaria", icon: Shield },
  { href: "/reports", label: "Reportes", icon: Map },
  { href: "/inventory", label: "Inventario", icon: Boxes },
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
  const { unreadCount } = await getNotificationSummary();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="hidden border-r border-white/10 bg-carbon-950/80 p-5 lg:block">
        <RuteroLogo href={homeHref} size="sm" className="mb-8" aria-label="Ir al inicio" />
        <nav className="grid gap-1">
          {allowedNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/[0.07] hover:text-white" href={item.href}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>
        <header className="sticky top-0 z-20 border-b border-white/10 bg-carbon-950/80 px-3 py-3 backdrop-blur sm:px-5 lg:px-8 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            <RuteroLogo href={homeHref} size="sm" showText={false} className="lg:hidden" aria-label="Ir al inicio" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-normal sm:text-2xl">{title}</h1>
              <p className="truncate text-sm text-zinc-400">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right text-sm md:block">
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-xs text-zinc-500">{roleLabel(user.role)}</p>
              </div>
              <div className="hidden rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300 sm:block">En linea</div>
              <Link href="/notifications" className="relative grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.06] sm:h-11 sm:w-11 sm:rounded-xl" aria-label="Ver notificaciones">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-xs font-black text-carbon-950">{unreadCount}</span>
                ) : null}
              </Link>
              <form action={logoutAction}>
                <button className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-zinc-200 hover:bg-white/[0.1] sm:h-11 sm:w-11 sm:rounded-xl" aria-label="Cerrar sesion">
                  <LogOut className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
          <nav className="mt-3 flex gap-1.5 overflow-x-auto lg:hidden">
            {allowedNavigation.slice(0, 8).map((item) => (
              <Link key={item.href} className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300" href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-3 py-4 sm:px-5 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
