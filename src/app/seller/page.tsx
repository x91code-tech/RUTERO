import Link from "next/link";
import type { ReactNode } from "react";
import { Banknote, CheckCircle2, Clock3, Landmark, MapPin, Search, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LoanPaymentForm } from "@/components/forms/loan-payment-form";
import { LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSellerDailyCollectionData } from "@/lib/seller-data";
import { formatCurrency, formatShortDate } from "@/lib/formatters";

export default async function SellerPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const { estado, q } = await searchParams;
  const { canCollect, cashboxStatus, company, items, totals } = await getSellerDailyCollectionData(q ?? "", estado ?? "todos");
  const disabledReason = canCollect ? undefined : cashboxStatus === "NOT_OPEN" ? "La caja de hoy no esta abierta." : "La caja de hoy ya fue cerrada.";

  return (
    <AppShell title="Ruta de cobro" subtitle="Clientes con prestamos activos, pago diario, atraso y saldo deudor.">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-5">
        <SummaryTile label="Por cobrar" value={String(totals.pendingClients)} icon={<Clock3 className="h-4 w-4" />} tone={totals.pendingClients > 0 ? "orange" : "green"} />
        <SummaryTile label="Ya pagaron" value={String(totals.paidClients)} icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
        <SummaryTile label="Esperado" value={formatCurrency(totals.expectedToday, company)} />
        <SummaryTile label="Cobrado" value={formatCurrency(totals.collectedToday, company)} tone="green" />
        <SummaryTile className="col-span-2 xl:col-span-1" label="Saldo activo" value={formatCurrency(totals.activeBalance, company)} />
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <form className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input name="q" defaultValue={q ?? ""} placeholder="Buscar cliente" className="pl-9" />
          <input type="hidden" name="estado" value={estado ?? "todos"} />
        </form>
        <div className="grid grid-cols-3 gap-2 lg:contents">
          <LinkButton href="/loans" variant="secondary" className="px-2 text-xs sm:text-sm"><Landmark className="h-4 w-4" /> Prestamo</LinkButton>
          <LinkButton href="/collections" variant="secondary" className="px-2 text-xs sm:text-sm"><WalletCards className="h-4 w-4" /> Recaudo</LinkButton>
          <LinkButton href="/expenses" variant="secondary" className="px-2 text-xs sm:text-sm"><Banknote className="h-4 w-4" /> Movimiento</LinkButton>
        </div>
      </div>

      {!canCollect ? (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          {disabledReason} Puedes consultar la ruta, pero no registrar cobros ni movimientos hasta que el administrador abra una caja nueva.
        </div>
      ) : null}

      <div className="mt-3 flex gap-2 overflow-x-auto">
        {[
          ["todos", "Todos"],
          ["pendientes", "Pendientes"],
          ["pagados", "Pagados"],
          ["atrasados", "Atrasados"]
        ].map(([value, label]) => {
          const active = (estado ?? "todos") === value;
          const href = `/seller?estado=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
          return (
            <Link key={value} href={href} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-brand-500 bg-brand-500 text-carbon-950" : "border-white/10 text-zinc-300 hover:bg-white/[0.06]"}`}>
              {label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2.5">
        {items.map((item) => {
          const stateClasses = item.isPaidToday
            ? "border-l-4 border-l-emerald-400"
            : item.lateAmount > 0
              ? "border-l-4 border-l-red-400"
              : "border-l-4 border-l-amber-400";
          const statusText = item.isPaidToday ? "Pagado hoy" : item.lateAmount > 0 ? "Atrasado" : "Pendiente";
          const statusColor = item.isPaidToday ? "text-emerald-300" : item.lateAmount > 0 ? "text-red-300" : "text-amber-300";
          const statusBorder = item.isPaidToday ? "border-emerald-400 text-emerald-300" : item.lateAmount > 0 ? "border-red-400 text-red-300" : "border-amber-400 text-amber-300";

          return (
            <article key={item.loan.id} className={`rounded-lg border border-white/10 bg-white/[0.04] p-2.5 shadow-sm ${stateClasses}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[0.7rem] font-black ${statusBorder}`}>
                      {item.client.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-black leading-tight sm:text-base">{item.client.name}</h2>
                      <p className="truncate text-xs text-zinc-400">{item.client.document || "Sin documento"} - {item.client.phone || "Sin telefono"}</p>
                    </div>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.client.address}</span>
                  </p>
                </div>

                <div className={`shrink-0 rounded-full bg-white/[0.06] px-2 py-1 text-[0.68rem] font-semibold ${statusColor}`}>
                  {statusText}
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
                <Info label="Vr. cuota" value={formatCurrency(item.loan.dailyPayment, company)} />
                <Info label="Cuota No." value={`${item.installmentNumber} / ${item.loan.termDays}`} />
                <Info label="Pago hoy" value={formatCurrency(item.receivedToday, company)} strongClass={item.isPaidToday ? "text-emerald-300" : "text-zinc-100"} />
                <Info label="Saldo deudor" value={formatCurrency(item.loan.balance, company)} />
                <Info label="Vence" value={formatShortDate(item.loan.dueDate)} />
              </div>

              <div className="mt-2.5 grid gap-2 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
                <div className="rounded-lg bg-carbon-900/70 px-2 py-1.5 text-[0.72rem] leading-5 text-zinc-300">
                  Entregado {formatCurrency(item.loan.disbursedAmount ?? item.loan.principalAmount, company)} - total {formatCurrency(item.loan.totalAmount, company)} - ganancia {formatCurrency(item.loan.interestAmount, company)}
                  {item.lateAmount > 0 ? <span className="ml-2 font-bold text-red-300">Atraso {formatCurrency(item.lateAmount, company)}</span> : null}
                </div>
                <LoanPaymentForm clientId={item.client.id} loan={item.loan} company={company} paidToday={item.paidToday} compact disabledReason={disabledReason} />
              </div>
            </article>
          );
        })}

        {items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center text-zinc-400">
            No hay prestamos activos para esta busqueda.
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function SummaryTile({ className = "", icon, label, tone = "neutral", value }: { className?: string; icon?: ReactNode; label: string; tone?: "neutral" | "green" | "orange"; value: string }) {
  const toneClass = tone === "green" ? "text-emerald-300" : tone === "orange" ? "text-orange-300" : "text-white";

  return (
    <div className={`surface rounded-xl p-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-zinc-400">{label}</p>
        {icon ? <span className="text-brand-500">{icon}</span> : null}
      </div>
      <p className={`mt-1 truncate text-lg font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function Info({ label, value, strongClass = "text-zinc-100" }: { label: string; value: string; strongClass?: string }) {
  return (
    <div className="rounded-md bg-white/[0.04] px-2 py-1.5">
      <p className="truncate text-[0.65rem] font-semibold uppercase leading-3 text-zinc-500">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-black ${strongClass}`}>{value}</p>
    </div>
  );
}
