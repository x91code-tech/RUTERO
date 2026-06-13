"use client";

import { useMemo, useState } from "react";
import { LocateFixed, MapPinned, Navigation, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { Client } from "@/lib/types";
import { buildGoogleMapsClientUrl, buildWazeClientUrl, getStoreLocation, hasClientLocation } from "@/lib/geo";

export function ClientLocationCard({ client }: { client: Client }) {
  const storeLocation = getStoreLocation(client);
  const secondaryLocation = client.locations?.find((location) => location.type !== "STORE") ?? null;
  const [storeLatitude, setStoreLatitude] = useState((storeLocation?.latitude ?? client.latitude)?.toString() ?? "");
  const [storeLongitude, setStoreLongitude] = useState((storeLocation?.longitude ?? client.longitude)?.toString() ?? "");
  const [secondaryLatitude, setSecondaryLatitude] = useState(secondaryLocation?.latitude.toString() ?? "");
  const [secondaryLongitude, setSecondaryLongitude] = useState(secondaryLocation?.longitude.toString() ?? "");
  const [status, setStatus] = useState("");
  const locatedClient = useMemo(() => {
    const parsedLatitude = Number(storeLatitude);
    const parsedLongitude = Number(storeLongitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) return null;
    return { ...client, latitude: parsedLatitude, longitude: parsedLongitude };
  }, [client, storeLatitude, storeLongitude]);

  function captureCurrentLocation(target: "store" | "secondary") {
    if (!navigator.geolocation) {
      setStatus("Este dispositivo no permite leer GPS desde el navegador.");
      return;
    }

    setStatus("Buscando ubicación actual...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (target === "store") {
          setStoreLatitude(position.coords.latitude.toFixed(7));
          setStoreLongitude(position.coords.longitude.toFixed(7));
        } else {
          setSecondaryLatitude(position.coords.latitude.toFixed(7));
          setSecondaryLongitude(position.coords.longitude.toFixed(7));
        }
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
          <h2 className="text-lg font-bold text-white">Ubicaciones GPS</h2>
          <p className="mt-1 text-sm text-zinc-400">Guarda tienda y una segunda ubicación para navegación, despacho o facturación.</p>
        </div>
        <MapPinned className="h-5 w-5 text-brand-500" />
      </div>
      <form className="grid gap-4">
        <input type="hidden" name="clientId" value={client.id} />
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="mb-3 font-semibold">Ubicación tienda</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitud tienda">
              <Input name="storeLatitude" value={storeLatitude} onChange={(event) => setStoreLatitude(event.target.value)} placeholder="10.5006000" />
            </Field>
            <Field label="Longitud tienda">
              <Input name="storeLongitude" value={storeLongitude} onChange={(event) => setStoreLongitude(event.target.value)} placeholder="-66.9146000" />
            </Field>
          </div>
          <Button type="button" variant="secondary" className="mt-3 w-full" onClick={() => captureCurrentLocation("store")}>
            <LocateFixed className="h-4 w-4" /> Usar mi ubicación actual para tienda
          </Button>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="mb-3 font-semibold">Segunda ubicación</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitud secundaria">
              <Input name="secondaryLatitude" value={secondaryLatitude} onChange={(event) => setSecondaryLatitude(event.target.value)} placeholder="10.5021000" />
            </Field>
            <Field label="Longitud secundaria">
              <Input name="secondaryLongitude" value={secondaryLongitude} onChange={(event) => setSecondaryLongitude(event.target.value)} placeholder="-66.9161000" />
            </Field>
          </div>
          <Button type="button" variant="secondary" className="mt-3 w-full" onClick={() => captureCurrentLocation("secondary")}>
            <LocateFixed className="h-4 w-4" /> Usar mi ubicación actual para segunda ubicación
          </Button>
        </div>
        <Button type="button" onClick={() => setStatus("Ubicaciones listas. Al conectar guardado real se persistirán con auditoría.")}>
          <Save className="h-4 w-4" /> Guardar ubicaciones
        </Button>
        {status ? <p className="text-sm text-zinc-400">{status}</p> : null}
      </form>
      {locatedClient && hasClientLocation(locatedClient) ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 font-semibold text-white" href={buildGoogleMapsClientUrl(locatedClient)} target="_blank">
            <MapPinned className="h-4 w-4" /> Abrir tienda en Maps
          </a>
          <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 font-semibold text-white" href={buildWazeClientUrl(locatedClient)} target="_blank">
            <Navigation className="h-4 w-4" /> Abrir tienda en Waze
          </a>
        </div>
      ) : null}
    </div>
  );
}
