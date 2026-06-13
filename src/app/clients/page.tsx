import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ClientForm } from "@/components/forms/client-form";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClientsPageData } from "@/lib/clients-data";
import { formatCurrency } from "@/lib/formatters";

const statusLabels = {
  ACTIVE: "Activo",
  PENDING: "Pendiente",
  DELINQUENT: "Moroso",
  INACTIVE: "Inactivo"
};

const errorMessages: Record<string, string> = {
  duplicate: "Ya existe un cliente con ese documento o teléfono en esta empresa."
};

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { clients, company, documents, locations, routes, users } = await getClientsPageData();

  return (
    <AppShell title="Clientes" subtitle="CRUD de clientes con saldo, ruta, vendedor e historial.">
      <div className="mb-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Crear cliente" description="El cliente queda pendiente de verificación y se generan sus documentos requeridos por país." />
          {error ? <p className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{errorMessages[error] ?? "No se pudo crear el cliente."}</p> : null}
          <ClientForm routes={routes} users={users} />
        </Card>
        <Card>
          <CardHeader title="Verificación" description="RUTERO valida duplicados y prepara los requisitos documentales del país." />
          <div className="grid gap-3 text-sm text-zinc-300">
            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="font-semibold text-white">Documento y teléfono únicos</p>
              <p className="mt-1 text-zinc-400">No se permite repetir documento ni teléfono dentro de la empresa.</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="font-semibold text-white">Ubicación tienda</p>
              <p className="mt-1 text-zinc-400">Se usa como punto principal para GPS, rutas y visitas.</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="font-semibold text-white">Documentos por país</p>
              <p className="mt-1 text-zinc-400">Al crear el cliente se genera la lista de requisitos según el país de la empresa.</p>
            </div>
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Lista de clientes" description="Controla saldos pendientes, estado y asignación de ruta." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => {
            const route = routes.find((item) => item.id === client.routeId);
            const seller = users.find((item) => item.id === client.sellerId);
            const hasStoreLocation = locations.some((location) => location.clientId === client.id && location.type === "STORE");
            const requiredDocuments = documents.filter((document) => document.clientId === client.id && document.required);
            const uploadedRequiredDocuments = requiredDocuments.filter((document) => document.status === "UPLOADED" || document.status === "APPROVED");
            return (
              <Link key={client.id} href={`/clients/${client.id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-brand-500/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{client.name}</h2>
                    <p className="mt-1 text-sm text-zinc-400">{client.document}</p>
                  </div>
                  <StatusBadge tone={client.status === "DELINQUENT" ? "red" : client.status === "PENDING" ? "orange" : "green"}>{statusLabels[client.status]}</StatusBadge>
                </div>
                <p className="mt-4 text-sm text-zinc-300">{client.address}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <span className="text-zinc-400">Ruta</span><span className="text-right">{route?.name}</span>
                  <span className="text-zinc-400">Vendedor</span><span className="text-right">{seller?.name}</span>
                  <span className="text-zinc-400">Saldo</span><span className="text-right font-bold">{formatCurrency(client.pendingBalance, company)}</span>
                  <span className="text-zinc-400">GPS tienda</span><span className="text-right">{hasStoreLocation ? "Guardado" : "Pendiente"}</span>
                  <span className="text-zinc-400">Documentos</span><span className="text-right">{uploadedRequiredDocuments.length}/{requiredDocuments.length}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}
