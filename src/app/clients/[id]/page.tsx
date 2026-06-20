import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ClientDocumentsCard } from "@/components/clients/client-documents-card";
import { ClientLocationCard } from "@/components/clients/client-location-card";
import { ClientVerificationForm } from "@/components/forms/client-verification-form";
import { LoanForm } from "@/components/forms/loan-form";
import { LoanPaymentForm } from "@/components/forms/loan-payment-form";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { collectionPaymentTypeLabel } from "@/lib/collection-payments";
import { getClientProfileData } from "@/lib/clients-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClientProfileData(id);
  if (!data) notFound();
  const { client, collections, company, loans, route, sales } = data;
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <AppShell title={client.name} subtitle="Perfil de cliente con historial comercial y cobranza.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-6">
          <Card>
            <CardHeader title="Datos del cliente" action={<StatusBadge tone={client.status === "DELINQUENT" ? "red" : "green"}>{client.status}</StatusBadge>} />
            <div className="space-y-3 text-sm">
              <p><span className="text-zinc-400">Teléfono:</span> {client.phone}</p>
              <p><span className="text-zinc-400">Dirección:</span> {client.address}</p>
              <p><span className="text-zinc-400">Documento:</span> {client.document}</p>
              <p><span className="text-zinc-400">Ruta:</span> {route?.name}</p>
              <p><span className="text-zinc-400">Saldo pendiente:</span> <strong>{formatCurrency(client.pendingBalance, company)}</strong></p>
              <p><span className="text-zinc-400">Notas:</span> {client.notes}</p>
            </div>
          </Card>
          <ClientVerificationForm client={client} />
          <Card>
            <CardHeader title="Nueva venta / prestamo" description="Registra el capital entregado y calcula cuotas diarias." />
            {client.status === "ACTIVE" ? (
              <LoanForm clients={[client]} company={company} defaultClientId={client.id} />
            ) : (
              <p className="rounded-xl bg-amber-500/15 p-4 text-sm text-amber-100">Este cliente debe estar activo/verificado antes de recibir prestamos.</p>
            )}
          </Card>
          <ClientLocationCard client={client} />
          <ClientDocumentsCard documents={client.documents ?? []} />
        </div>
        <Card>
          <CardHeader title="Prestamos activos" description="Capital entregado, cuota diaria y saldo deudor." />
          <div className="space-y-3">
            {loans.map((loan) => (
              <div key={loan.id} className="rounded-xl bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">Total {formatCurrency(loan.totalAmount, company)}</p>
                  <StatusBadge tone={loan.status === "PAID" ? "green" : loan.status === "OVERDUE" ? "red" : "orange"}>{loan.status}</StatusBadge>
                </div>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <p><span className="text-zinc-400">Entregado</span><br /><strong>{formatCurrency(loan.principalAmount, company)}</strong></p>
                  <p><span className="text-zinc-400">Valor cuota</span><br /><strong>{formatCurrency(loan.dailyPayment, company)}</strong></p>
                  <p><span className="text-zinc-400">Saldo</span><br /><strong>{formatCurrency(loan.balance, company)}</strong></p>
                </div>
                {loan.status === "ACTIVE" && loan.balance > 0 ? (
                  <div className="mt-4">
                    <LoanPaymentForm
                      clientId={client.id}
                      loan={loan}
                      company={company}
                      paidToday={collections.filter((collection) => collection.loanId === loan.id && collection.date.startsWith(todayKey)).reduce((total, collection) => total + (collection.balanceApplied ?? collection.amount), 0)}
                    />
                  </div>
                ) : null}
              </div>
            ))}
            {loans.length === 0 ? <p className="rounded-xl bg-white/[0.04] p-4 text-sm text-zinc-400">Este cliente todavia no tiene prestamos.</p> : null}
          </div>
        </Card>

        <Card>
          <CardHeader title="Historial" description="Ventas y recaudos relacionados con este cliente." />
          <div className="space-y-3">
            {[...sales, ...collections].map((movement) => (
              <div key={movement.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-4">
                <div>
                  <p className="font-semibold">{"product" in movement ? movement.product : "Recaudo registrado"}</p>
                  <p className="text-sm text-zinc-400">
                    {paymentMethodLabel(movement.paymentMethod, company.countryCode)}
                    {"paymentType" in movement ? ` - ${collectionPaymentTypeLabel(movement.paymentType)}` : ""}
                  </p>
                  {"balanceApplied" in movement ? (
                    <p className="text-xs text-zinc-500">Aplicado a deuda {formatCurrency(movement.balanceApplied ?? movement.amount, company)}</p>
                  ) : null}
                </div>
                <p className="font-black">{formatCurrency(movement.amount, company)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
