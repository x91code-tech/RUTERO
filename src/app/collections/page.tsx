import { AppShell } from "@/components/layout/app-shell";
import { CollectionForm } from "@/components/forms/movement-form";
import { Card, CardHeader } from "@/components/ui/card";
import { collectionApplicationLabel, collectionPaymentTypeLabel } from "@/lib/collection-payments";
import { getFinancialPageData } from "@/lib/financial-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

const errorMessages: Record<string, string> = {
  renewal_requires_full_payment: "La configuracion de la empresa exige pagar el saldo completo o autorizacion administrativa para renovar."
};

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { clients, collections, company, loans } = await getFinancialPageData();

  return (
    <AppShell title="Recaudos" subtitle="Cobranza con calculo de saldo anterior, saldo nuevo e impacto de caja.">
      {error ? <p className="mb-4 rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-amber-100">{errorMessages[error] ?? "No se pudo registrar el recaudo."}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Registrar recaudo" description="Reduce el saldo pendiente del cliente y del prestamo seleccionado." />
          <CollectionForm clients={clients} company={company} loans={loans} />
        </Card>
        <Card>
          <CardHeader title="Recaudos recientes" />
          <div className="space-y-3">
            {collections.map((collection) => {
              const client = clients.find((item) => item.id === collection.clientId);

              return (
                <div key={collection.id} className="rounded-xl bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{client?.name}</p>
                    <p className="font-black">{formatCurrency(collection.amount, company)}</p>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    {paymentMethodLabel(collection.paymentMethod, company.countryCode)} - {collectionPaymentTypeLabel(collection.paymentType)} - {collectionApplicationLabel(collection.application)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Aplicado a deuda {formatCurrency(collection.balanceApplied ?? collection.amount, company)} - Saldo nuevo {formatCurrency(collection.newBalance, company)}
                    {(collection.overpaymentAmount ?? 0) > 0 ? ` - Sobrante ${formatCurrency(collection.overpaymentAmount ?? 0, company)}` : ""}
                    {collection.loanId ? " - prestamo" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
