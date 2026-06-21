"use client";

import { useMemo, useState } from "react";
import { LocateFixed, MapPinned, Navigation, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import type { Client } from "@/lib/types";
import { buildGoogleMapsClientUrl, buildWazeClientUrl, getStoreLocation, hasClientLocation } from "@/lib/geo";
import { updateClientLocationAction } from "@/server/actions/client-actions";

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

    setStatus("Buscando ubicacion actual...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (target === "store") {
          setStoreLatitude(position.coords.latitude.toFixed(7));
          setStoreLongitude(position.coords.longitude.toFixed(7));
        } else {
          setSecondaryLatitude(position.coords.latitude.toFixed(7));
          setSecondaryLongitude(position.coords.longitude.toFixed(7));
        }
        setStatus("Ubicacion capturada. Revisa y guarda.");
      },
      () => setStatus("No se pudo obtener la ubicacion. Revisa permisos de GPS."),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  return (
    <div className="surface rounded-lg p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Ubicaciones GPS</h2>
          <p className="mt-1 text-sm text-zinc-400">Guarda tienda y una segunda ubicacion para rutas, despacho o facturacion.</p>
        </div>
        <MapPinned className="h-5 w-5 text-brand-500" />
      </div>

      <div className="grid gap-4">
        <form action={updateClientLocationAction} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <input type="hidden" name="clientId" value={client.id} />
          <input type="hidden" name="type" value="STORE" />
          <input type="hidden" name="label" value="Ubicacion tienda" />
          <input type="hidden" name="isPrimary" value="true" />
          <p className="mb-3 font-semibold">Ubicacion tienda</p>
          <div className="grid gap-4">
            <Field label="Direccion tienda">
              <Input name="address" defaultValue={storeLocation?.address ?? client.address} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Latitud tienda">
                <Input name="latitude" value={storeLatitude} onChange={(event) => setStoreLatitude(event.target.value)} placeholder="10.5006000" />
              </Field>
              <Field label="Longitud tienda">
                <Input name="longitude" value={storeLongitude} onChange={(event) => setStoreLongitude(event.target.value)} placeholder="-66.9146000" />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={() => captureCurrentLocation("store")}>
                <LocateFixed className="h-4 w-4" /> Usar GPS actual
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4" /> Guardar tienda
              </Button>
            </div>
          </div>
        </form>

        <form action={updateClientLocationAction} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <input type="hidden" name="clientId" value={client.id} />
          <input type="hidden" name="type" value="BILLING" />
          <input type="hidden" name="label" value="Segunda ubicacion" />
          <input type="hidden" name="isPrimary" value="false" />
          <p className="mb-3 font-semibold">Segunda ubicacion</p>
          <div className="grid gap-4">
            <Field label="Direccion secundaria">
              <Input name="address" defaultValue={secondaryLocation?.address ?? "Segunda ubicacion"} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Latitud secundaria">
                <Input name="latitude" value={secondaryLatitude} onChange={(event) => setSecondaryLatitude(event.target.value)} placeholder="10.5021000" />
              </Field>
              <Field label="Longitud secundaria">
                <Input name="longitude" value={secondaryLongitude} onChange={(event) => setSecondaryLongitude(event.target.value)} placeholder="-66.9161000" />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={() => captureCurrentLocation("secondary")}>
                <LocateFixed className="h-4 w-4" /> Usar GPS actual
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4" /> Guardar segunda
              </Button>
            </div>
          </div>
        </form>
      </div>

      {status ? <p className="mt-3 text-sm text-zinc-400">{status}</p> : null}

      {locatedClient && hasClientLocation(locatedClient) ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 font-semibold text-white transition hover:bg-white/[0.1]" href={buildGoogleMapsClientUrl(locatedClient)} target="_blank">
            <MapPinned className="h-4 w-4" /> Abrir tienda en Maps
          </a>
          <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2 font-semibold text-white transition hover:bg-white/[0.1]" href={buildWazeClientUrl(locatedClient)} target="_blank">
            <Navigation className="h-4 w-4" /> Abrir tienda en Waze
          </a>
        </div>
      ) : null}
    </div>
  );
}
