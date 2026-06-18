import { Landmark } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LoanForm } from "@/components/forms/loan-form";
import { MetricCard } from "@/components/cards/metric-card";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFinancialPageData } from "@/lib/financial-data";
import { formatCurrency } from "@/lib/formatters";

export default async function LoansPage() {
  const { clients, company, loans } = await getFinancialPageData();
  const activeLoans = loans.filter((loan) => loan.status === "ACTIVE");
  const activeBalance = activeLoans.reduce((total, loan) => total + loan.balance, 0);
  const dailyExpected = activeLoans.reduce((total, loan) => total + loan.dailyPayment, 0);
  const projectedInterest = loans.reduce((total, loan) => total + loan.interestAmount, 0);

  return (
    <AppShell title="Prestamos" subtitle="Registra el dinero entregado, calcula interes, cuotas y saldo automatico.">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Saldo activo" value={formatCurrency(activeBalance, company)} icon={<Landmark />} />
        <MetricCard label="Cobro diario esperado" value={formatCurrency(dailyExpected, company)} />
        <MetricCard label="Ganancia proyectada" value={formatCurrency(projectedInterest, company)} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Nuevo prestamo" description="Capital entregado + interes = total a cobrar en cuotas diarias." />
          <LoanForm clients={clients} company={company} />
        </Card>
        <Card>
          <CardHeader title="Prestamos recientes" />
          <div className="space-y-3">
            {loans.map((loan) => {
              const client = clients.find((item) => item.id === loan.clientId);
              const tone = loan.status === "PAID" ? "green" : loan.status === "OVERDUE" ? "red" : "orange";

              return (
                <div key={loan.id} className="rounded-xl bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{client?.name}</p>
                      <p className="text-sm text-zinc-400">
                        Entregado {formatCurrency(loan.principalAmount, company)} - Total {formatCurrency(loan.totalAmount, company)}
                      </p>
                    </div>
                    <StatusBadge tone={tone}>{loan.status}</StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <p><span className="text-zinc-400">Cuota diaria</span><br /><strong>{formatCurrency(loan.dailyPayment, company)}</strong></p>
                    <p><span className="text-zinc-400">Pagado</span><br /><strong>{formatCurrency(loan.paidAmount, company)}</strong></p>
                    <p><span className="text-zinc-400">Saldo</span><br /><strong>{formatCurrency(loan.balance, company)}</strong></p>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                    <p className="rounded-lg bg-carbon-950/45 p-2"><span className="text-zinc-500">Capital pendiente</span><br /><strong>{formatCurrency(loan.principalBalance ?? loan.balance, company)}</strong></p>
                    <p className="rounded-lg bg-carbon-950/45 p-2"><span className="text-zinc-500">Interes pendiente</span><br /><strong>{formatCurrency(loan.interestBalance ?? 0, company)}</strong></p>
                    <p className="rounded-lg bg-carbon-950/45 p-2"><span className="text-zinc-500">Mora pendiente</span><br /><strong>{formatCurrency(loan.lateFeeBalance ?? 0, company)}</strong></p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
