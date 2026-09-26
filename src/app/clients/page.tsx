import Link from "next/link";
import { FilterX, MapPin, Search, ShieldCheck, Users, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ClientForm } from "@/components/forms/client-form";
import { Button, LinkButton } from "@/components/ui/button";
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
  duplicate: "Ya existe un cliente con ese documento o telefono en esta empresa.",
  route_seller_mismatch: "La ruta seleccionada pertenece a otro cobrador."
};

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ balance?: string; error?: string; q?: string; routeId?: string; sellerId?: string; status?: string }> }) {
  const { balance, error, q, routeId, sellerId, status } = await searchParams;
  const { clients, company, documents, locations, routes, users } = await getClientsPageData();
  const normalizedQuery = (q ?? "").trim().toLowerCase();
  const clientsWithBalance = clients.filter((client) => client.pendingBalance > 0).length;
  const pendingClients = clients.filter((client) => client.status === "PENDING").length;
  const clientsWithoutStoreLocation = clients.filter((client) => !locations.some((location) => location.clientId === client.id && location.type === "STORE")).length;
  const activeFilters = [
    Boolean(normalizedQuery),
    Boolean(status && status !== "ALL"),
    Boolean(routeId && routeId !== "ALL"),
    Boolean(sellerId && sellerId !== "ALL"),
    Boolean(balance && balance !== "ALL")
  ].filter(Boolean).length;
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
      <div className="mb-3 grid grid-cols-2 divide-x divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-carbon-900 sm:grid-cols-4">
        <Metric label="Clientes" value={clients.length} icon={<Users className="h-4 w-4" />} />
        <Metric label="Con saldo" value={clientsWithBalance} icon={<WalletCards className="h-4 w-4" />} />
        <Metric label="Por verificar" value={pendingClients} icon={<ShieldCheck className="h-4 w-4" />} />
        <Metric label="Sin GPS" value={clientsWithoutStoreLocation} icon={<MapPin className="h-4 w-4" />} />
      </div>

      <details id="crear-cliente" className="mb-3 rounded-xl border border-white/10 bg-carbon-900" open={Boolean(error) || undefined}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
          <span>
            <span className="block text-sm font-semibold text-white">Crear cliente</span>
            <span className="mt-0.5 block text-xs text-zinc-500">Añade sus datos, asignación y ubicaciones</span>
          </span>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500 text-lg font-medium text-white">+</span>
        </summary>
        <div className="border-t border-white/10 p-3 sm:p-5">
          <p className="mb-4 text-xs leading-5 text-zinc-500">El país, los documentos y la moneda se determinan según el cobrador asignado. El cliente quedará pendiente de verificación.</p>
          {error ? <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-200">{errorMessages[error] ?? "No se pudo crear el cliente."}</p> : null}
          <ClientForm routes={routes} users={users} companyCountryCode={company.countryCode} />
        </div>
      </details>

      <Card className="p-3 sm:p-5">
        <CardHeader title="Clientes" description="Cartera, asignación y verificación en una sola vista." />
        <form className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input name="q" defaultValue={q ?? ""} placeholder="Nombre, documento o teléfono" className="min-h-10 pl-10" />
          </div>
          <Select name="status" defaultValue={status ?? "ALL"} className="min-h-10">
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="PENDING">Pendientes</option>
            <option value="DELINQUENT">Morosos</option>
            <option value="INACTIVE">Inactivos</option>
          </Select>
          <Button type="submit" className="min-h-10 px-4">Buscar</Button>
          <details className="group sm:col-span-3">
            <summary className="flex cursor-pointer list-none items-center gap-2 py-2 text-xs font-medium text-zinc-500 marker:content-none hover:text-zinc-300">
              Mas filtros
              <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[0.62rem] text-zinc-300">{activeFilters}</span>
            </summary>
            <div className="grid gap-2 pb-2 sm:grid-cols-3">
              <Select name="routeId" defaultValue={routeId ?? "ALL"} className="min-h-10">
                <option value="ALL">Todas las rutas</option>
                {routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
              </Select>
              <Select name="sellerId" defaultValue={sellerId ?? "ALL"} className="min-h-10">
                <option value="ALL">Todos los cobradores</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </Select>
              <Select name="balance" defaultValue={balance ?? "ALL"} className="min-h-10">
                <option value="ALL">Todos los saldos</option>
                <option value="WITH_BALANCE">Con saldo</option>
                <option value="WITHOUT_BALANCE">Sin saldo</option>
              </Select>
            </div>
          </details>
        </form>
        <div className="mb-3 flex items-center justify-between border-b border-white/[0.07] pb-3 text-xs text-zinc-500">
          <p><span className="font-semibold text-zinc-200">{filteredClients.length}</span> de {clients.length} clientes</p>
          {activeFilters > 0 ? <LinkButton href="/clients" variant="ghost" className="min-h-8 px-2 text-xs"><FilterX className="h-3.5 w-3.5" /> Limpiar</LinkButton> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Asignación</th>
                <th>Verificación</th>
                <th className="text-right">Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const route = routes.find((item) => item.id === client.routeId);
                const collector = users.find((item) => item.id === client.sellerId);
                const hasStoreLocation = locations.some((location) => location.clientId === client.id && location.type === "STORE");
                const requiredDocuments = documents.filter((document) => document.clientId === client.id && document.required);
                const uploadedRequiredDocuments = requiredDocuments.filter((document) => document.status === "UPLOADED" || document.status === "APPROVED");
                const tone = client.status === "DELINQUENT" ? "red" : client.status === "PENDING" ? "orange" : "green";

                return (
                  <tr key={client.id}>
                    <td>
                      <Link href={`/clients/${client.id}`} className="font-semibold text-zinc-100 hover:text-brand-300">{client.name}</Link>
                      <p className="mt-0.5 text-xs text-zinc-500">{client.document} · {client.phone}</p>
                    </td>
                    <td>
                      <p className="text-zinc-300">{collector?.name ?? "Sin cobrador"}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{route?.name ?? "Sin ruta"}</p>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={tone}>{statusLabels[client.status]}</StatusBadge>
                        <span className={`text-xs ${hasStoreLocation ? "text-zinc-400" : "text-amber-300"}`}>{hasStoreLocation ? "GPS listo" : "Falta GPS"}</span>
                        <span className="text-xs text-zinc-500">Docs {uploadedRequiredDocuments.length}/{requiredDocuments.length}</span>
                      </div>
                    </td>
                    <td className="text-right font-semibold tabular-nums">{formatCurrency(client.pendingBalance, client)}</td>
                    <td className="text-right">
                      <LinkButton href={client.pendingBalance > 0 ? `/clients/${client.id}#cobrar` : `/clients/${client.id}#prestamo`} className="min-h-8 px-3 text-xs">
                        {client.pendingBalance > 0 ? "Recaudar" : "Prestamo"}
                      </LinkButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-2 md:hidden">
          {filteredClients.map((client) => {
            const route = routes.find((item) => item.id === client.routeId);
            const collector = users.find((item) => item.id === client.sellerId);
            const hasStoreLocation = locations.some((location) => location.clientId === client.id && location.type === "STORE");
            const requiredDocuments = documents.filter((document) => document.clientId === client.id && document.required);
            const uploadedRequiredDocuments = requiredDocuments.filter((document) => document.status === "UPLOADED" || document.status === "APPROVED");

            return (
              <article key={client.id} className="rounded-lg border border-white/[0.08] bg-carbon-950/70 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/clients/${client.id}`} className="min-w-0 truncate text-sm font-semibold text-white">{client.name}</Link>
                  <StatusBadge tone={client.status === "DELINQUENT" ? "red" : client.status === "PENDING" ? "orange" : "green"}>{statusLabels[client.status]}</StatusBadge>
                </div>
                <p className="mt-0.5 truncate text-[0.68rem] text-zinc-500">{client.document} · {client.phone}</p>
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2">
                  <div className="min-w-0">
                    <p className="truncate text-[0.65rem] text-zinc-500">{route?.name ?? "Sin ruta"} · {collector?.name ?? "Sin cobrador"}</p>
                    <p className="mt-0.5 text-xs font-semibold tabular-nums text-zinc-200">{formatCurrency(client.pendingBalance, client)} <span className="font-normal text-zinc-500">saldo</span></p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[0.62rem] text-zinc-500">Docs {uploadedRequiredDocuments.length}/{requiredDocuments.length}</span>
                    <span className={`text-[0.62rem] ${hasStoreLocation ? "text-zinc-500" : "text-amber-300"}`}>{hasStoreLocation ? "GPS" : "GPS pendiente"}</span>
                    <LinkButton href={client.pendingBalance > 0 ? `/clients/${client.id}#cobrar` : `/clients/${client.id}#prestamo`} className="min-h-8 px-2.5 text-[0.65rem]">
                      {client.pendingBalance > 0 ? "Cobrar" : "Abrir"}
                    </LinkButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {filteredClients.length === 0 ? <p className="mt-2 rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-zinc-500">{clients.length === 0 ? "Aun no hay clientes. Usa «Crear cliente» para registrar el primero." : "No hay clientes con esos filtros."}</p> : null}
      </Card>
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 px-3 py-2.5 sm:px-4">
      <span className="hidden text-zinc-500 sm:block">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[0.6rem] font-medium uppercase tracking-[0.08em] text-zinc-500">{label}</p>
        <p className="mt-0.5 text-base font-semibold leading-none tabular-nums text-zinc-100 sm:text-lg">{value}</p>
      </div>
    </div>
  );
}
