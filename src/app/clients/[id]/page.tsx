import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ClientDocumentsCard } from "@/components/clients/client-documents-card";
import { ClientLocationCard } from "@/components/clients/client-location-card";
import { ClientVerificationForm } from "@/components/forms/client-verification-form";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClientProfileData } from "@/lib/clients-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClientProfileData(id);
  if (!data) notFound();
  const { client, collections, company, route, sales } = data;

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
          <ClientLocationCard client={client} />
          <ClientDocumentsCard documents={client.documents ?? []} />
        </div>
        <Card>
          <CardHeader title="Historial" description="Ventas y recaudos relacionados con este cliente." />
          <div className="space-y-3">
            {[...sales, ...collections].map((movement) => (
              <div key={movement.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-4">
                <div>
                  <p className="font-semibold">{"product" in movement ? movement.product : "Recaudo registrado"}</p>
                  <p className="text-sm text-zinc-400">{paymentMethodLabel(movement.paymentMethod, company.countryCode)}</p>
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
