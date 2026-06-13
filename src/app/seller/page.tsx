import { Banknote, CheckCircle2, Clock3, Landmark, MapPin, Search, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/cards/metric-card";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPaymentMethodsForCountry } from "@/lib/payment-methods";
import { getSellerDailyCollectionData } from "@/lib/seller-data";
import { formatCurrency, formatShortDate } from "@/lib/formatters";
import { createCollectionAction } from "@/server/actions/financial-actions";

export default async function SellerPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { company, items, totals } = await getSellerDailyCollectionData(q ?? "");
  const defaultPaymentMethod = getPaymentMethodsForCountry(company.countryCode)[0]?.code ?? "CASH";

  return (
    <AppShell title="Ruta de cobro" subtitle="Clientes con prestamos activos, pago diario, atraso y saldo deudor.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Por cobrar" value={String(totals.pendingClients)} icon={<Clock3 />} tone={totals.pendingClients > 0 ? "orange" : "green"} />
        <MetricCard label="Ya pagaron" value={String(totals.paidClients)} icon={<CheckCircle2 />} />
        <MetricCard label="Esperado hoy" value={formatCurrency(totals.expectedToday, company)} />
        <MetricCard label="Cobrado hoy" value={formatCurrency(totals.collectedToday, company)} />
        <MetricCard label="Saldo activo" value={formatCurrency(totals.activeBalance, company)} />
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <form className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input name="q" defaultValue={q ?? ""} placeholder="Buscar por nombre, documento, telefono o direccion" className="pl-10" />
        </form>
        <LinkButton href="/loans" variant="secondary"><Landmark className="h-4 w-4" /> Nueva venta</LinkButton>
        <LinkButton href="/collections" variant="secondary"><WalletCards className="h-4 w-4" /> Recaudo manual</LinkButton>
        <LinkButton href="/expenses" variant="secondary"><Banknote className="h-4 w-4" /> Gasto</LinkButton>
      </div>

      <div className="mt-6 grid gap-4">
        {items.map((item) => {
          const expectedPayment = Math.min(item.loan.dailyPayment, item.loan.balance);
          const dueToday = Math.max(expectedPayment - item.paidToday, 0);
          const stateClasses = item.isPaidToday
            ? "border-l-4 border-l-emerald-400"
            : item.lateAmount > 0
              ? "border-l-4 border-l-red-400"
              : "border-l-4 border-l-amber-400";
          const statusText = item.isPaidToday ? "Pagado hoy" : item.lateAmount > 0 ? "Atrasado" : "Pendiente";
          const statusColor = item.isPaidToday ? "text-emerald-300" : item.lateAmount > 0 ? "text-red-300" : "text-amber-300";

          return (
            <article key={item.loan.id} className={`rounded-xl border border-white/10 bg-white/[0.04] p-4 shadow-sm ${stateClasses}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-black ${item.isPaidToday ? "border-emerald-400 text-emerald-300" : item.lateAmount > 0 ? "border-red-400 text-red-300" : "border-amber-400 text-amber-300"}`}>
                      {item.client.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black">{item.client.name}</h2>
                      <p className="truncate text-sm text-zinc-400">{item.client.document} - {item.client.phone}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.client.address}</span>
                  </p>
                </div>

                <div className={`rounded-full bg-white/[0.06] px-3 py-1 text-sm font-semibold ${statusColor}`}>
                  {statusText}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Info label="Vr. cuota" value={formatCurrency(item.loan.dailyPayment, company)} />
                <Info label="Cuota No." value={`${item.installmentNumber} / ${item.loan.termDays}`} />
                <Info label="Pago hoy" value={formatCurrency(item.paidToday, company)} strongClass={item.isPaidToday ? "text-emerald-300" : "text-zinc-100"} />
                <Info label="Saldo deudor" value={formatCurrency(item.loan.balance, company)} />
                <Info label="Vence" value={formatShortDate(item.loan.dueDate)} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="rounded-lg bg-carbon-900/70 p-3 text-sm text-zinc-300">
                  Prestado {formatCurrency(item.loan.principalAmount, company)} - total {formatCurrency(item.loan.totalAmount, company)} - ganancia {formatCurrency(item.loan.interestAmount, company)}
                  {item.lateAmount > 0 ? <span className="ml-2 font-bold text-red-300">Atraso {formatCurrency(item.lateAmount, company)}</span> : null}
                </div>
                <form action={createCollectionAction}>
                  <input type="hidden" name="clientId" value={item.client.id} />
                  <input type="hidden" name="loanId" value={item.loan.id} />
                  <input type="hidden" name="amount" value={dueToday.toFixed(2)} />
                  <input type="hidden" name="paymentMethod" value={defaultPaymentMethod} />
                  <input type="hidden" name="observation" value="Pago diario registrado desde ruta de cobro" />
                  <Button type="submit" disabled={dueToday <= 0} className="w-full sm:w-auto">
                    {dueToday > 0 ? `Cobrar ${formatCurrency(dueToday, company)}` : "Cobrado"}
                  </Button>
                </form>
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

function Info({ label, value, strongClass = "text-zinc-100" }: { label: string; value: string; strongClass?: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] p-3">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-black ${strongClass}`}>{value}</p>
    </div>
  );
}
