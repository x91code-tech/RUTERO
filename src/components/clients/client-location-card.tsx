"use client";

import { useMemo, useState } from "react";
import { LocateFixed, MapPinned, Navigation, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { Client } from "@/lib/types";
import { buildGoogleMapsClientUrl, buildWazeClientUrl, hasClientLocation } from "@/lib/geo";

export function ClientLocationCard({ client }: { client: Client }) {
  const [latitude, setLatitude] = useState(client.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(client.longitude?.toString() ?? "");
  const [status, setStatus] = useState("");
  const locatedClient = useMemo(() => {
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) return null;
    return { ...client, latitude: parsedLatitude, longitude: parsedLongitude };
  }, [client, latitude, longitude]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus("Este dispositivo no permite leer GPS desde el navegador.");
      return;
    }

    setStatus("Buscando ubicación actual...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(7));
        setLongitude(position.coords.longitude.toFixed(7));
        setStatus("Ubicación capturada. Revisa y guarda el cliente.");
      },
      () => setStatus("No se pudo obtener la ubicación. Revisa permisos de GPS."),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  return (
    <div className="surface rounded-2xl p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Ubicación GPS</h2>
          <p className="mt-1 text-sm text-zinc-400">Guarda el punto exacto para navegación y rutas automáticas.</p>
        </div>
        <MapPinned className="h-5 w-5 text-brand-500" />
      </div>
      <form className="grid gap-4">
        <input type="hidden" name="clientId" value={client.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitud">
            <Input name="latitude" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="10.5006000" />
          </Field>
          <Field label="Longitud">
            <Input name="longitude" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="-66.9146000" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={useCurrentLocation}>
            <LocateFixed className="h-4 w-4" /> Usar mi ubicación actual
          </Button>
          <Button type="button" onClick={() => setStatus("Ubicación lista. Al conectar la base de datos se guardará con auditoría.")}>
            <Save className="h-4 w-4" /> Guardar ubicación
          </Button>
        </div>
        {status ? <p className="text-sm text-zinc-400">{status}</p> : null}
      </form>
      {locatedClient && hasClientLocation(locatedClient) ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 font-semibold text-white" href={buildGoogleMapsClientUrl(locatedClient)} target="_blank">
            <MapPinned className="h-4 w-4" /> Abrir en Maps
          </a>
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 font-semibold text-white" href={buildWazeClientUrl(locatedClient)} target="_blank">
            <Navigation className="h-4 w-4" /> Abrir en Waze
          </a>
        </div>
      ) : null}
    </div>
  );
}
