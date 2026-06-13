import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { demoClientDocuments, demoClientLocations, demoClients, demoCompany, demoRoutes, demoUsers } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/formatters";

const statusLabels = {
  ACTIVE: "Activo",
  PENDING: "Pendiente",
  DELINQUENT: "Moroso",
  INACTIVE: "Inactivo"
};

export default function ClientsPage() {
  return (
    <AppShell title="Clientes" subtitle="CRUD de clientes con saldo, ruta, vendedor e historial.">
      <Card>
        <CardHeader title="Lista de clientes" description="Controla saldos pendientes, estado y asignación de ruta." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demoClients.map((client) => {
            const route = demoRoutes.find((item) => item.id === client.routeId);
            const seller = demoUsers.find((item) => item.id === client.sellerId);
            const hasStoreLocation = demoClientLocations.some((location) => location.clientId === client.id && location.type === "STORE");
            const requiredDocuments = demoClientDocuments.filter((document) => document.clientId === client.id && document.required);
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
                  <span className="text-zinc-400">Saldo</span><span className="text-right font-bold">{formatCurrency(client.pendingBalance, demoCompany)}</span>
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
