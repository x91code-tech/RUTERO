import Link from "next/link";
import { Bell, Boxes, ClipboardList, CreditCard, Home, Map, ReceiptText, Route, Settings, Shield, Users, WalletCards } from "lucide-react";
import { demoNotifications } from "@/lib/demo-data";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/seller", label: "Vendedor", icon: CreditCard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/routes", label: "Rutas", icon: Route },
  { href: "/sales", label: "Ventas", icon: ReceiptText },
  { href: "/collections", label: "Recaudos", icon: WalletCards },
  { href: "/expenses", label: "Gastos", icon: ClipboardList },
  { href: "/cashbox", label: "Caja diaria", icon: Shield },
  { href: "/reports", label: "Reportes", icon: Map },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/settings", label: "Configuración", icon: Settings }
];

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="hidden border-r border-white/10 bg-carbon-950/80 p-5 lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 font-black text-carbon-950">R</span>
          <span className="font-bold">RUTERO</span>
        </Link>
        <nav className="grid gap-1">
          {navigation.map((item) => {
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
        <header className="sticky top-0 z-20 border-b border-white/10 bg-carbon-950/80 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-normal">{title}</h1>
              <p className="text-sm text-zinc-400">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300 sm:block">En línea</div>
              <button className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06]" aria-label="Ver alertas">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-xs font-black text-carbon-950">{demoNotifications.length}</span>
              </button>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {navigation.slice(0, 8).map((item) => (
              <Link key={item.href} className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-300" href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
