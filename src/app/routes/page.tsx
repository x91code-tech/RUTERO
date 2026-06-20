import { AlertTriangle, ExternalLink, MapPinned, Navigation } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { RouteForm } from "@/components/forms/route-form";
import { Card, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClientsPageData } from "@/lib/clients-data";
import { formatCurrency } from "@/lib/formatters";
import { buildGoogleMapsClientUrl, buildGoogleMapsRouteUrl, buildWazeClientUrl, getClientNavigationPoint, optimizeVisitOrder } from "@/lib/geo";
import type { Client, ClientLocation, Loan } from "@/lib/types";

type RouteClient = Client & { locations: ClientLocation[] };

export default async function RoutesPage() {
  const { clients: allClients, collections, company, loans, locations, routes, users } = await getClientsPageData();

  return (
    <AppShell title="Rutas del dia" subtitle="Clientes por cobrar, GPS y estado real de la ruta.">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <div className="grid gap-4">
          <Card>
            <CardHeader title="Crear ruta" description="Crea rutas por zona y asignales cobradores o supervisores." />
            <RouteForm users={users} />
          </Card>

          {routes.map((route) => {
            const seller = users.find((user) => user.id === route.sellerId);
            const clients = allClients
              .filter((client) => route.clientIds.includes(client.id))
              .map((client) => ({
                ...client,
                locations: locations.filter((location) => location.clientId === client.id)
              }));
            const clientsWithLocation = clients.map(getClientNavigationPoint).filter((client) => client !== null);
            const orderedLocatedIds = new Set(optimizeVisitOrder(clientsWithLocation).map((client) => client.id));
            const orderedClients = [
              ...optimizeVisitOrder(clientsWithLocation)
                .map((locatedClient) => clients.find((client) => client.id === locatedClient.id))
                .filter((client): client is RouteClient => Boolean(client)),
              ...clients.filter((client) => !orderedLocatedIds.has(client.id))
            ];
            const routeLoans = loans.filter((loan) => route.clientIds.includes(loan.clientId) && loan.status === "ACTIVE" && loan.balance > 0);
            const routeCollections = collections.filter((collection) => route.clientIds.includes(collection.clientId));
            const paidClientIds = new Set(routeCollections.map((collection) => collection.clientId));
            const pendingCount = routeLoans.filter((loan) => !paidClientIds.has(loan.clientId)).length;
            const collectedCount = paidClientIds.size;
            const activeBalance = routeLoans.reduce((total, loan) => total + loan.balance, 0);

            return (
              <Card key={route.id}>
                <CardHeader
                  title={route.name}
                  description={`${route.zone} - ${seller?.name ?? "Sin cobrador"}`}
                  action={<StatusBadge tone={clientsWithLocation.length === clients.length ? "green" : "orange"}>{clientsWithLocation.length}/{clients.length} con GPS</StatusBadge>}
                />

                <div className="mb-4 grid gap-3 sm:grid-cols-4">
                  <RouteStat label="Clientes" value={String(clients.length)} />
                  <RouteStat label="Por cobrar" value={String(pendingCount)} tone={pendingCount > 0 ? "orange" : "green"} />
                  <RouteStat label="Cobrados hoy" value={String(collectedCount)} tone="green" />
                  <RouteStat label="Saldo activo" value={formatCurrency(activeBalance, company)} />
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <LinkButton href={buildGoogleMapsRouteUrl(clientsWithLocation)} target="_blank" variant="primary">
                    <Navigation className="h-4 w-4" /> Abrir ruta en GPS
                  </LinkButton>
                  <LinkButton href={buildGoogleMapsRouteUrl(optimizeVisitOrder(clientsWithLocation))} target="_blank" variant="secondary">
                    <MapPinned className="h-4 w-4" /> Ruta optimizada
                  </LinkButton>
                </div>

                <div className="space-y-3">
                  {orderedClients.length > 0 ? (
                    orderedClients.map((client, index) => {
                      const navigationPoint = getClientNavigationPoint(client);
                      const activeLoan = routeLoans.find((loan) => loan.clientId === client.id);
                      const paidToday = routeCollections.some((collection) => collection.clientId === client.id);
                      const status = getRouteClientStatus(client, activeLoan, paidToday);

                      return (
                        <div key={client.id} className="grid gap-3 rounded-xl bg-white/[0.04] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <p className="font-semibold">{index + 1}. {client.name}</p>
                            <p className="text-sm text-zinc-400">{navigationPoint?.address ?? client.address}</p>
                            {navigationPoint ? (
                              <p className="mt-1 text-xs text-zinc-500">{navigationPoint.latitude.toFixed(5)}, {navigationPoint.longitude.toFixed(5)}</p>
                            ) : (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-300"><AlertTriangle className="h-3 w-3" /> Sin ubicacion GPS</p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                            {activeLoan ? <span className="text-sm font-bold text-zinc-200">{formatCurrency(activeLoan.balance, company)}</span> : null}
                            {navigationPoint ? (
                              <>
                                <a className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-200 hover:bg-white/[0.1]" href={buildGoogleMapsClientUrl(navigationPoint)} target="_blank" aria-label={`Abrir ${client.name} en Google Maps`}>
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                                <a className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-200 hover:bg-white/[0.1]" href={buildWazeClientUrl(navigationPoint)} target="_blank" aria-label={`Abrir ${client.name} en Waze`}>
                                  <Navigation className="h-4 w-4" />
                                </a>
                              </>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-400">
                      Esta ruta todavia no tiene clientes asignados.
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader title="Lectura operativa" description="Lo importante para salir a cobrar sin ruido." />
          <div className="grid gap-3 text-sm text-zinc-300">
            <Insight title="GPS primero" text="Los clientes sin ubicacion quedan visibles para corregirlos antes de armar la ruta." />
            <Insight title="Por cobrar" text="Solo cuenta clientes con prestamo activo que no han pagado hoy." />
            <Insight title="Ruta optimizada" text="Ordena los puntos con GPS usando distancia aproximada; Google Maps abre la navegacion real." />
            <Insight title="Sin inventario" text="RUTERO queda enfocado en prestamos, recaudos, caja y cartera." />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function getRouteClientStatus(client: Client, activeLoan?: Loan, paidToday?: boolean): { label: string; tone: "green" | "red" | "orange" | "gray" | "blue" } {
  if (client.status === "PENDING") return { label: "Por verificar", tone: "orange" };
  if (!activeLoan) return { label: "Sin prestamo", tone: "gray" };
  if (paidToday) return { label: "Cobrado hoy", tone: "green" };
  if (new Date(activeLoan.dueDate) < new Date()) return { label: "Vencido", tone: "red" };
  return { label: "Por cobrar", tone: "orange" };
}

function RouteStat({ label, tone = "neutral", value }: { label: string; tone?: "neutral" | "green" | "orange"; value: string }) {
  const toneClass = tone === "green" ? "text-emerald-300" : tone === "orange" ? "text-orange-300" : "text-white";

  return (
    <div className="rounded-xl bg-carbon-950/50 p-3">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 text-lg font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function Insight({ text, title }: { text: string; title: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="font-bold text-white">{title}</p>
      <p className="mt-1 text-zinc-400">{text}</p>
    </div>
  );
}
