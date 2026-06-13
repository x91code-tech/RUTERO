import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { CollectionForm } from "@/components/forms/movement-form";
import { getFinancialPageData } from "@/lib/financial-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default async function CollectionsPage() {
  const { clients, collections, company } = await getFinancialPageData();

  return (
    <AppShell title="Recaudos" subtitle="Cobranza con cálculo de saldo anterior, saldo nuevo e impacto de caja.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card><CardHeader title="Registrar recaudo" description="Reduce el saldo pendiente del cliente automáticamente." /><CollectionForm clients={clients} company={company} /></Card>
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
                  <p className="mt-1 text-sm text-zinc-400">{paymentMethodLabel(collection.paymentMethod, company.countryCode)} · Saldo nuevo {formatCurrency(collection.newBalance, company)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
