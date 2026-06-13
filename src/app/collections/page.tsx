import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { CollectionForm } from "@/components/forms/movement-form";
import { demoClients, demoCollections, demoCompany } from "@/lib/demo-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default function CollectionsPage() {
  return (
    <AppShell title="Recaudos" subtitle="Cobranza con cálculo de saldo anterior, saldo nuevo e impacto de caja.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card><CardHeader title="Registrar recaudo" description="Reduce el saldo pendiente del cliente automáticamente." /><CollectionForm /></Card>
        <Card>
          <CardHeader title="Recaudos recientes" />
          <div className="space-y-3">
            {demoCollections.map((collection) => {
              const client = demoClients.find((item) => item.id === collection.clientId);
              return (
                <div key={collection.id} className="rounded-xl bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{client?.name}</p>
                    <p className="font-black">{formatCurrency(collection.amount, demoCompany)}</p>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{paymentMethodLabel(collection.paymentMethod)} · Saldo nuevo {formatCurrency(collection.newBalance, demoCompany)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
