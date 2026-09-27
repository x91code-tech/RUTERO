import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, MapPin, MapPinned, Navigation, Phone, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LoanPaymentForm } from "@/components/forms/loan-payment-form";
import { Input } from "@/components/ui/input";
import { buildGoogleMapsClientUrl } from "@/lib/geo";
import { getSellerDailyCollectionData } from "@/lib/seller-data";
import { formatCurrency, formatShortDate } from "@/lib/formatters";

export default async function SellerPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const { estado, q } = await searchParams;
  const { canCollect, cashboxStatus, company, currency, items, totals } = await getSellerDailyCollectionData(q ?? "", estado ?? "todos");
  const disabledReason = canCollect ? undefined : cashboxStatus === "NOT_OPEN" ? "La caja de hoy no esta abierta." : "La caja de hoy ya fue cerrada.";
  const collectionProgress = totals.expectedToday > 0
    ? Math.min((totals.collectedToday / totals.expectedToday) * 100, 100)
    : 0;

  return (
    <AppShell title="Ruta de cobro" subtitle="Clientes con prestamos activos, pago diario, atraso y saldo deudor.">
      <section className="overflow-hidden rounded-[1.75rem] border border-[#e9dfd2] bg-[#f2ece3] text-[#211d18] shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#211d18] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#f2ece3]">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                Jornada de hoy
              </span>
              <span className="text-xs font-medium text-[#71685f]">Ruta de cobro · {items.length} {items.length === 1 ? "cliente" : "clientes"} en pantalla</span>
            </div>
            <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#71685f]">Recaudado hoy</p>
                <p className="mt-1 text-4xl font-black leading-none tracking-[-0.07em] tabular-nums sm:text-5xl">{formatCurrency(totals.collectedToday, currency)}</p>
              </div>
              <div className="min-w-36 border-l border-[#d8cbbb] pl-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#71685f]">Meta de ruta</p>
                <p className="mt-1 text-xl font-bold tracking-[-0.04em] tabular-nums">{formatCurrency(totals.expectedToday, currency)}</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="h-2 overflow-hidden rounded-full bg-[#d9d0c5]">
                <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${collectionProgress}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[0.68rem] font-semibold text-[#71685f]">
                <span>{Math.round(collectionProgress)}% de la meta recaudada</span>
                <span>{formatCurrency(Math.max(totals.expectedToday - totals.collectedToday, 0), currency)} pendiente</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-[#d8cbbb] lg:grid-cols-1 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-3 border-r border-[#d8cbbb] p-4 lg:border-b lg:border-r-0 lg:p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6ded3] text-[#71685f]"><Clock3 className="h-[1.1rem] w-[1.1rem]" /></span>
              <div>
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#71685f]">Por visitar</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums">{totals.pendingClients}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 lg:p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6ded3] text-[#71685f]"><CheckCircle2 className="h-[1.1rem] w-[1.1rem]" /></span>
              <div>
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#71685f]">Al dia</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums">{totals.paidClients}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-brand-300">Cartera activa</p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.04em] text-white sm:text-2xl">Paradas de la ruta</h2>
        </div>
        <p className="text-xs text-zinc-500">Saldo total en cartera <span className="ml-1 font-semibold tabular-nums text-zinc-300">{formatCurrency(totals.activeBalance, currency)}</span></p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            ["todos", "Todos"],
            ["pendientes", "Pendientes"],
            ["pagados", "Pagados"],
            ["atrasados", "Atrasados"]
          ].map(([value, label]) => {
            const active = (estado ?? "todos") === value;
            const href = `/seller?estado=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
            return (
              <Link key={value} href={href} className={`shrink-0 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${active ? "border-brand-400 text-white" : "border-transparent text-zinc-500 hover:text-zinc-200"}`}>
                {label}
              </Link>
            );
          })}
        </div>
        <form className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input name="q" defaultValue={q ?? ""} placeholder="Buscar en la ruta" className="min-h-10 rounded-full border-white/10 bg-carbon-900 pl-9" />
          <input type="hidden" name="estado" value={estado ?? "todos"} />
        </form>
      </div>

      {!canCollect ? (
        <div className="mt-4 flex items-start gap-3 border-l-2 border-amber-400 bg-amber-400/[0.06] px-4 py-3 text-sm leading-6 text-amber-100">
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-300" />
          <p>{disabledReason} Puedes consultar la ruta, pero no registrar recaudos ni movimientos hasta que el administrador abra una caja nueva.</p>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3">
        {items.map((item, index) => {
          const stateClasses = item.isPaidToday
            ? "border-l-4 border-l-emerald-400"
            : item.lateAmount > 0
              ? "border-l-4 border-l-red-400"
              : "border-l-4 border-l-amber-400";
          const statusText = item.isPaidToday ? "Recaudado hoy" : item.lateAmount > 0 ? "Atrasado" : "Pendiente";
          const statusColor = item.isPaidToday ? "text-emerald-300" : item.lateAmount > 0 ? "text-red-300" : "text-amber-300";

          return (
            <article key={item.loan.id} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-carbon-900 shadow-soft ${stateClasses}`}>
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="min-w-0">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-zinc-500">Parada {String(index + 1).padStart(2, "0")}</p>
                    <h3 className="mt-1 truncate text-lg font-bold leading-tight tracking-[-0.03em] text-white sm:text-xl">{item.client.name}</h3>
                    <p className="mt-1 truncate text-xs text-zinc-500">{item.client.document || "Sin documento"} <span className="px-1.5 text-zinc-700">/</span> {item.client.phone || "Sin telefono"}</p>
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.client.address}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 sm:min-w-48 sm:justify-end sm:border-0 sm:pt-0">
                  <div className="sm:text-right">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-zinc-500">{item.amountDueToday > 0 ? "Pendiente hoy" : "Cuota cubierta"}</p>
                    <p className="mt-1 text-lg font-bold tracking-[-0.04em] tabular-nums text-white">{formatCurrency(item.amountDueToday, item.loan)}</p>
                  </div>
                  <div className={`shrink-0 rounded-full border border-white/10 bg-carbon-950 px-2.5 py-1.5 text-[0.65rem] font-semibold ${statusColor}`}>
                    {statusText}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-y border-white/[0.07] bg-black/10 sm:grid-cols-4">
                <Info label="Cuotas" value={`${item.installmentNumber} / ${item.loan.termDays}`} />
                <Info label="Recaudado" value={formatCurrency(item.receivedToday, item.loan)} strongClass={item.isPaidToday ? "text-emerald-300" : "text-zinc-100"} />
                <Info label="Saldo" value={formatCurrency(item.loan.balance, item.loan)} />
                <Info className="hidden sm:block" label="Vence" value={formatShortDate(item.loan.dueDate)} />
              </div>

              <div className="grid gap-3 p-3.5 sm:grid-cols-[minmax(0,1fr)_22rem] sm:items-center sm:p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <span>Entregado <strong className="font-semibold text-zinc-300">{formatCurrency(item.loan.disbursedAmount ?? item.loan.principalAmount, item.loan)}</strong></span>
                  <span>Total <strong className="font-semibold text-zinc-300">{formatCurrency(item.loan.totalAmount, item.loan)}</strong></span>
                  {item.lateAmount > 0 ? <span className="font-semibold text-red-300">Atraso {formatCurrency(item.lateAmount, item.loan)}</span> : null}
                </div>
                <LoanPaymentForm clientId={item.client.id} loan={item.loan} company={company} clientName={item.client.name} paidToday={item.paidToday} compact disabledReason={disabledReason} />
              </div>
              <div className="flex flex-wrap gap-2 px-3.5 pb-3.5 sm:px-4 sm:pb-4">
                {item.client.phone ? (
                  <a
                    href={`tel:${item.client.phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-carbon-950 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-carbon-850 sm:flex-none"
                  >
                    <Phone className="h-4 w-4" />
                    Llamar
                  </a>
                ) : null}
                <a
                  href={buildGoogleMapsClientUrl(item.client)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-carbon-950 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-carbon-850 sm:flex-none"
                >
                  <Navigation className="h-4 w-4" />
                  Cómo llegar
                </a>
              </div>
            </article>
          );
        })}

        {items.length === 0 ? (
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-carbon-900 px-5 py-10 sm:px-8 sm:py-12">
            <div className="absolute inset-y-0 left-0 w-1 bg-brand-500" />
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-carbon-950 text-brand-300">
                <MapPinned className="h-6 w-6" strokeWidth={1.6} />
              </div>
              <p className="mt-5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-brand-300">Ruta en pausa</p>
              <h3 className="mt-2 text-xl font-bold tracking-[-0.04em] text-white sm:text-2xl">
                {q ? "No encontramos ese cliente" : "Todavia no hay paradas asignadas"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
                {q
                  ? "Prueba con otro nombre, documento o telefono, o limpia la busqueda para volver a ver la ruta."
                  : "Cuando haya prestamos activos asignados a tu ruta, apareceran aqui en el orden de visita."}
              </p>
              {q ? (
                <Link href="/seller" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-300 hover:text-brand-200">
                  Volver a la ruta completa <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function Info({ className = "", label, value, strongClass = "text-zinc-100" }: { className?: string; label: string; value: string; strongClass?: string }) {
  return (
    <div className={`min-w-0 px-3 py-2.5 sm:px-4 ${className}`}>
      <p className="truncate text-[0.6rem] font-semibold uppercase leading-3 tracking-[0.08em] text-zinc-500">{label}</p>
      <p className={`mt-1 truncate text-xs font-semibold tabular-nums sm:text-sm ${strongClass}`}>{value}</p>
    </div>
  );
}
