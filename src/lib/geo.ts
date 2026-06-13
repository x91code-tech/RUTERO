import type { Client, ClientLocation } from "@/lib/types";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type ClientWithLocation = Client & Required<Pick<Client, "latitude" | "longitude">>;

export function hasClientLocation(client: Client): client is ClientWithLocation {
  return typeof client.latitude === "number" && typeof client.longitude === "number";
}

export function getStoreLocation(client: Client): ClientLocation | null {
  return client.locations?.find((location) => location.type === "STORE") ?? client.locations?.find((location) => location.isPrimary) ?? null;
}

export function getClientNavigationPoint(client: Client): ClientWithLocation | null {
  const storeLocation = getStoreLocation(client);
  if (storeLocation) {
    return {
      ...client,
      address: storeLocation.address,
      latitude: storeLocation.latitude,
      longitude: storeLocation.longitude
    };
  }

  return hasClientLocation(client) ? client : null;
}

export function calculateDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function optimizeVisitOrder(clients: ClientWithLocation[], start?: Coordinates) {
  if (clients.length <= 2) return clients;

  const remaining = [...clients];
  const ordered: ClientWithLocation[] = [];
  let current = start ?? {
    latitude: remaining[0].latitude,
    longitude: remaining[0].longitude
  };

  while (remaining.length > 0) {
    const next = remaining
      .map((client) => ({
        client,
        distance: calculateDistanceKm(current, {
          latitude: client.latitude,
          longitude: client.longitude
        })
      }))
      .sort((a, b) => a.distance - b.distance)[0].client;

    ordered.push(next);
    current = { latitude: next.latitude, longitude: next.longitude };
    remaining.splice(remaining.findIndex((client) => client.id === next.id), 1);
  }

  return ordered;
}

export function buildGoogleMapsClientUrl(client: ClientWithLocation) {
  return `https://www.google.com/maps/search/?api=1&query=${client.latitude},${client.longitude}`;
}

export function buildGoogleMapsRouteUrl(clients: ClientWithLocation[], start?: Coordinates) {
  const ordered = optimizeVisitOrder(clients, start);
  const origin = start ? `${start.latitude},${start.longitude}` : "Current+Location";
  const destination = ordered.at(-1);
  const waypoints = ordered.slice(0, -1).map((client) => `${client.latitude},${client.longitude}`).join("|");
  const params = new URLSearchParams({
    api: "1",
    travelmode: "driving",
    origin,
    destination: destination ? `${destination.latitude},${destination.longitude}` : origin
  });

  if (waypoints) params.set("waypoints", waypoints);

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildWazeClientUrl(client: ClientWithLocation) {
  return `https://waze.com/ul?ll=${client.latitude},${client.longitude}&navigate=yes`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
