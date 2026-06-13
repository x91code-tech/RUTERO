import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ClientLocationCard } from "@/components/clients/client-location-card";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { demoClients, demoCollections, demoCompany, demoRoutes, demoSales } from "@/lib/demo-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = demoClients.find((item) => item.id === id);
  if (!client) notFound();
  const route = demoRoutes.find((item) => item.id === client.routeId);
  const sales = demoSales.filter((sale) => sale.clientId === client.id);
  const collections = demoCollections.filter((collection) => collection.clientId === client.id);

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
              <p><span className="text-zinc-400">Saldo pendiente:</span> <strong>{formatCurrency(client.pendingBalance, demoCompany)}</strong></p>
              <p><span className="text-zinc-400">Notas:</span> {client.notes}</p>
            </div>
          </Card>
          <ClientLocationCard client={client} />
        </div>
        <Card>
          <CardHeader title="Historial" description="Ventas y recaudos relacionados con este cliente." />
          <div className="space-y-3">
            {[...sales, ...collections].map((movement) => (
              <div key={movement.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-4">
                <div>
                  <p className="font-semibold">{"product" in movement ? movement.product : "Recaudo registrado"}</p>
                  <p className="text-sm text-zinc-400">{paymentMethodLabel(movement.paymentMethod)}</p>
                </div>
                <p className="font-black">{formatCurrency(movement.amount, demoCompany)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
