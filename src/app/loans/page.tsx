import { ExternalLink, Landmark, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LoanForm } from "@/components/forms/loan-form";
import { MetricCard } from "@/components/cards/metric-card";
import { LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFinancialPageData } from "@/lib/financial-data";
import { formatCurrency } from "@/lib/formatters";
import { groupByCurrency } from "@/lib/money-groups";
import { shouldCollectOnDate } from "@/lib/loan-schedule";

export default async function LoansPage() {
  const { clients, company, loans } = await getFinancialPageData();
  const loanGroups = groupByCurrency(loans);
  const displayGroups = loanGroups.length ? loanGroups : [{
    countryCode: company.countryCode,
    currencyCode: company.currencyCode,
    countryName: company.countryCode,
    items: []
  }];

  return (
    <AppShell title="Prestamos" subtitle="Registra el dinero entregado, calcula interes, cuotas y saldo automatico.">
      <div className="grid gap-4">
        {displayGroups.map((group) => {
          const activeLoans = group.items.filter((loan) => loan.status === "ACTIVE");
          const activeBalance = activeLoans.reduce((total, loan) => total + loan.balance, 0);
          const dailyExpected = activeLoans
            .filter((loan) => shouldCollectOnDate({ startDate: loan.startDate, frequency: loan.paymentFrequency }))
            .reduce((total, loan) => total + loan.dailyPayment, 0);
          const projectedInterest = group.items.reduce((total, loan) => total + loan.interestAmount, 0);
          const currency = { countryCode: group.countryCode, currencyCode: group.currencyCode };

          return (
            <section key={`${group.countryCode}-${group.currencyCode}`}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">{group.countryName} · {group.currencyCode}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Saldo cartera" value={formatCurrency(activeBalance, currency)} icon={<Landmark />} />
                <MetricCard label="Recaudo esperado hoy" value={formatCurrency(dailyExpected, currency)} />
                <MetricCard label="Ganancia proyectada" value={formatCurrency(projectedInterest, currency)} />
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card id="nuevo-prestamo">
          <CardHeader title="Nuevo prestamo" description="Capital entregado + interes = total a recuperar en cuotas diarias." />
          <LoanForm clients={clients} company={company} />
        </Card>
        <Card>
          <CardHeader title="Prestamos recientes" />
          <div className="space-y-3">
            {loans.length > 0 ? loans.map((loan) => {
              const client = clients.find((item) => item.id === loan.clientId);
              const tone = loan.status === "PAID" ? "green" : loan.status === "OVERDUE" ? "red" : "orange";

              return (
                <div key={loan.id} className="interactive-surface rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{client?.name}</p>
                      <p className="text-sm text-zinc-400">
                        Entregado {formatCurrency(loan.disbursedAmount ?? loan.principalAmount, loan)} - Capital {formatCurrency(loan.principalAmount, loan)} - Total {formatCurrency(loan.totalAmount, loan)}
                      </p>
                    </div>
                    <StatusBadge tone={tone}>{loan.status}</StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <p><span className="text-zinc-400">Valor cuota</span><br /><strong>{formatCurrency(loan.dailyPayment, loan)}</strong></p>
                    <p><span className="text-zinc-400">Pagado</span><br /><strong>{formatCurrency(loan.paidAmount, loan)}</strong></p>
                    <p><span className="text-zinc-400">Saldo</span><br /><strong>{formatCurrency(loan.balance, loan)}</strong></p>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                    <p className="rounded-lg bg-carbon-950/45 p-2"><span className="text-zinc-500">Capital pendiente</span><br /><strong>{formatCurrency(loan.principalBalance ?? loan.balance, loan)}</strong></p>
                    <p className="rounded-lg bg-carbon-950/45 p-2"><span className="text-zinc-500">Interes pendiente</span><br /><strong>{formatCurrency(loan.interestBalance ?? 0, loan)}</strong></p>
                    <p className="rounded-lg bg-carbon-950/45 p-2"><span className="text-zinc-500">Mora pendiente</span><br /><strong>{formatCurrency(loan.lateFeeBalance ?? 0, loan)}</strong></p>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <LinkButton href={`/clients/${loan.clientId}`} variant="secondary" className="min-h-9 text-xs">
                      <ExternalLink className="h-4 w-4" /> Abrir cliente
                    </LinkButton>
                    <LinkButton href={`/clients/${loan.clientId}#cobrar`} className="min-h-9 text-xs">
                      <WalletCards className="h-4 w-4" /> Recaudar
                    </LinkButton>
                  </div>
                </div>
              );
            }) : (
              <p className="rounded-lg border border-white/10 bg-carbon-950 p-4 text-sm text-zinc-400">
                Todavia no hay prestamos registrados.
              </p>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
