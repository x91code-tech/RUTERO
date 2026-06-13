import { ExternalLink, MapPinned, Navigation } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { demoClientLocations, demoClients, demoRoutes, demoUsers } from "@/lib/demo-data";
import { buildGoogleMapsClientUrl, buildGoogleMapsRouteUrl, buildWazeClientUrl, getClientNavigationPoint, optimizeVisitOrder } from "@/lib/geo";

export default function RoutesPage() {
  const statuses = ["Pendiente", "Visitado", "Cobrado", "Venta realizada", "No encontrado"];

  return (
    <AppShell title="Rutas del día" subtitle="Orden de visita, estado de clientes y resumen operativo.">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-4">
          {demoRoutes.map((route) => {
            const seller = demoUsers.find((user) => user.id === route.sellerId);
            const clients = demoClients
              .filter((client) => route.clientIds.includes(client.id))
              .map((client) => ({
                ...client,
                locations: demoClientLocations.filter((location) => location.clientId === client.id)
              }));
            const clientsWithLocation = clients.map(getClientNavigationPoint).filter((client) => client !== null);
            const orderedClients = optimizeVisitOrder(clientsWithLocation);
            return (
              <Card key={route.id}>
                <CardHeader
                  title={route.name}
                  description={`${route.zone} · ${seller?.name}`}
                  action={<StatusBadge tone={clientsWithLocation.length === clients.length ? "green" : "orange"}>{clientsWithLocation.length}/{clients.length} con GPS</StatusBadge>}
                />
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <LinkButton href={buildGoogleMapsRouteUrl(clientsWithLocation)} target="_blank" variant="primary">
                    <Navigation className="h-4 w-4" /> Abrir ruta en GPS
                  </LinkButton>
                  <LinkButton href={buildGoogleMapsRouteUrl(orderedClients)} target="_blank" variant="secondary">
                    <MapPinned className="h-4 w-4" /> Ruta optimizada
                  </LinkButton>
                </div>
                <div className="space-y-3">
                  {orderedClients.map((client, index) => (
                    <div key={client.id} className="grid gap-3 rounded-xl bg-white/[0.04] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="font-semibold">{index + 1}. {client.name}</p>
                        <p className="text-sm text-zinc-400">{client.address}</p>
                        <p className="mt-1 text-xs text-zinc-500">{client.latitude.toFixed(5)}, {client.longitude.toFixed(5)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <StatusBadge tone={index % 2 === 0 ? "green" : "orange"}>{statuses[index % statuses.length]}</StatusBadge>
                        <a className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-200 hover:bg-white/[0.1]" href={buildGoogleMapsClientUrl(client)} target="_blank" aria-label={`Abrir ${client.name} en Google Maps`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <a className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-200 hover:bg-white/[0.1]" href={buildWazeClientUrl(client)} target="_blank" aria-label={`Abrir ${client.name} en Waze`}>
                          <Navigation className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
        <Card>
          <CardHeader title="Mapa de ruta" description="Placeholder preparado para integrar mapas reales." />
          <div className="relative min-h-[28rem] overflow-hidden rounded-2xl border border-white/10 bg-carbon-900 p-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
            <div className="relative flex h-full min-h-[24rem] items-center justify-center">
              <div className="rounded-2xl bg-brand-500 p-4 text-carbon-950 shadow-glow">
                <MapPinned className="mx-auto h-10 w-10" />
                <p className="mt-3 font-black">Ruta GPS activa</p>
                <p className="text-sm opacity-80">Clientes con ubicación y orden sugerido</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
