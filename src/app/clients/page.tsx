import Link from "next/link";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ClientForm } from "@/components/forms/client-form";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
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
  duplicate: "Ya existe un cliente con ese documento o telefono en esta empresa."
};

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ balance?: string; error?: string; q?: string; routeId?: string; sellerId?: string; status?: string }> }) {
  const { balance, error, q, routeId, sellerId, status } = await searchParams;
  const { clients, company, documents, locations, routes, users } = await getClientsPageData();
  const normalizedQuery = (q ?? "").trim().toLowerCase();
  const filteredClients = clients.filter((client) => {
    const matchesQuery = !normalizedQuery || [client.name, client.document, client.phone, client.address]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
    const matchesStatus = !status || status === "ALL" || client.status === status;
    const matchesRoute = !routeId || routeId === "ALL" || client.routeId === routeId;
    const matchesSeller = !sellerId || sellerId === "ALL" || client.sellerId === sellerId;
    const matchesBalance = !balance || balance === "ALL" || (balance === "WITH_BALANCE" ? client.pendingBalance > 0 : client.pendingBalance <= 0);
    return matchesQuery && matchesStatus && matchesRoute && matchesSeller && matchesBalance;
  });

  return (
    <AppShell title="Clientes" subtitle="Clientes con saldo, ruta, cobrador, documentos y ubicacion.">
      <div className="mb-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Crear cliente" description="El cliente queda pendiente de verificacion y se generan sus documentos requeridos por pais." />
          {error ? <p className="mb-4 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{errorMessages[error] ?? "No se pudo crear el cliente."}</p> : null}
          <ClientForm routes={routes} users={users} />
        </Card>
        <Card>
          <CardHeader title="Control del cliente" description="Antes de prestar, valida identidad, ubicacion y cobrador asignado." />
          <div className="grid gap-3 text-sm text-zinc-300">
            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="font-semibold text-white">Documento y telefono unicos</p>
              <p className="mt-1 text-zinc-400">No se permite repetir documento ni telefono dentro de la empresa.</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="font-semibold text-white">Ubicacion tienda</p>
              <p className="mt-1 text-zinc-400">Se usa como punto principal para GPS, rutas y visitas.</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="font-semibold text-white">Documentos por pais</p>
              <p className="mt-1 text-zinc-400">Al crear el cliente se genera la lista de requisitos segun el pais de la empresa.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Lista de clientes" description="Filtra por busqueda, estado, ruta, cobrador y saldo." />
        <form className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input name="q" defaultValue={q ?? ""} placeholder="Buscar cliente, documento, telefono o direccion" className="pl-10" />
          </div>
          <Select name="status" defaultValue={status ?? "ALL"}>
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="PENDING">Pendientes</option>
            <option value="DELINQUENT">Morosos</option>
            <option value="INACTIVE">Inactivos</option>
          </Select>
          <Select name="routeId" defaultValue={routeId ?? "ALL"}>
            <option value="ALL">Todas las rutas</option>
            {routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
          </Select>
          <Select name="sellerId" defaultValue={sellerId ?? "ALL"}>
            <option value="ALL">Todos los cobradores</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </Select>
          <Select name="balance" defaultValue={balance ?? "ALL"}>
            <option value="ALL">Todos los saldos</option>
            <option value="WITH_BALANCE">Con saldo</option>
            <option value="WITHOUT_BALANCE">Sin saldo</option>
          </Select>
          <button className="rounded-xl bg-brand-500 px-4 py-3 font-semibold text-carbon-950 lg:col-span-5" type="submit">Aplicar filtros</button>
        </form>
        <p className="mb-4 text-sm text-zinc-400">{filteredClients.length} de {clients.length} clientes</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClients.map((client) => {
            const route = routes.find((item) => item.id === client.routeId);
            const collector = users.find((item) => item.id === client.sellerId);
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
                  <span className="text-zinc-400">Ruta</span><span className="text-right">{route?.name ?? "-"}</span>
                  <span className="text-zinc-400">Cobrador</span><span className="text-right">{collector?.name ?? "-"}</span>
                  <span className="text-zinc-400">Saldo</span><span className="text-right font-bold">{formatCurrency(client.pendingBalance, company)}</span>
                  <span className="text-zinc-400">GPS tienda</span><span className="text-right">{hasStoreLocation ? "Guardado" : "Pendiente"}</span>
                  <span className="text-zinc-400">Documentos</span><span className="text-right">{uploadedRequiredDocuments.length}/{requiredDocuments.length}</span>
                </div>
              </Link>
            );
          })}
        </div>
        {filteredClients.length === 0 ? <p className="mt-5 rounded-xl bg-white/[0.04] p-5 text-center text-sm text-zinc-400">No hay clientes con esos filtros.</p> : null}
      </Card>
    </AppShell>
  );
}
