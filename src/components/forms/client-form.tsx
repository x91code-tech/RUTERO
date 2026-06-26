"use client";

import { useRef, useState } from "react";
import { Crosshair, FileScan, Loader2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { Route, User } from "@/lib/types";
import { createClientAction } from "@/server/actions/client-actions";

type ClientDraft = {
  name: string;
  document: string;
  phone: string;
  address: string;
  storeLatitude: string;
  storeLongitude: string;
  secondaryAddress: string;
  secondaryLatitude: string;
  secondaryLongitude: string;
  notes: string;
};

type AiDocumentResponse = {
  fullName?: string;
  document?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  confidence?: number;
  warnings?: string[];
  error?: string;
};

const initialDraft: ClientDraft = {
  name: "",
  document: "",
  phone: "",
  address: "",
  storeLatitude: "",
  storeLongitude: "",
  secondaryAddress: "",
  secondaryLatitude: "",
  secondaryLongitude: "",
  notes: ""
};

function toCoordinate(value: number) {
  return value.toFixed(7);
}

export function ClientForm({ routes, users }: { routes: Route[]; users: User[] }) {
  const collectors = users.filter((user) => user.role === "SELLER" || user.role === "SUPERVISOR");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<ClientDraft>(initialDraft);
  const [scanStatus, setScanStatus] = useState("");
  const [gpsStatus, setGpsStatus] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLocating, setIsLocating] = useState<"store" | "secondary" | null>(null);

  function updateDraft(field: keyof ClientDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function scanDocument(file: File | undefined) {
    if (!file) return;
    setIsScanning(true);
    setScanStatus("Leyendo documento con Gemini...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/client-document", {
        method: "POST",
        body: formData
      });
      const data = (await response.json()) as AiDocumentResponse;

      if (!response.ok || data.error) {
        setScanStatus(data.error ?? "No se pudo leer el documento.");
        return;
      }

      setDraft((current) => ({
        ...current,
        name: data.fullName || current.name,
        document: data.document || current.document,
        phone: data.phone || current.phone,
        address: data.address || current.address,
        notes: [
          current.notes,
          data.birthDate ? `Fecha de nacimiento detectada: ${data.birthDate}` : "",
          typeof data.confidence === "number" ? `Confianza IA: ${Math.round(data.confidence * 100)}%` : "",
          ...(data.warnings ?? []).map((warning) => `Revision: ${warning}`)
        ].filter(Boolean).join("\n")
      }));

      setScanStatus("Datos detectados. Revisalos antes de crear el cliente.");
    } catch {
      setScanStatus("No se pudo conectar con Gemini.");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function captureLocation(type: "store" | "secondary") {
    if (!navigator.geolocation) {
      setGpsStatus("Este dispositivo no permite capturar GPS.");
      return;
    }

    setIsLocating(type);
    setGpsStatus(type === "store" ? "Capturando ubicacion tienda..." : "Capturando ubicacion residencia...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = toCoordinate(position.coords.latitude);
        const longitude = toCoordinate(position.coords.longitude);
        setDraft((current) => ({
          ...current,
          ...(type === "store"
            ? { storeLatitude: latitude, storeLongitude: longitude }
            : { secondaryLatitude: latitude, secondaryLongitude: longitude })
        }));
        setGpsStatus(type === "store" ? "GPS de tienda capturado." : "GPS de residencia capturado.");
        setIsLocating(null);
      },
      () => {
        setGpsStatus("No se pudo capturar el GPS. Revisa permisos de ubicacion.");
        setIsLocating(null);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }

  return (
    <form action={createClientAction} className="grid gap-4">
      <div className="rounded-lg border border-brand-500/25 bg-brand-500/10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">Asistente con Gemini</p>
            <p className="text-sm text-zinc-400">Sube una foto del documento para rellenar datos. Siempre revisa antes de guardar.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
            {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileScan className="h-4 w-4" />}
            ESCANEA DOCUMENTO
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => scanDocument(event.target.files?.[0])}
        />
        {scanStatus ? <p className="mt-3 text-sm text-zinc-300">{scanStatus}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del cliente">
          <Input name="name" value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Nombre comercial o razon social" required />
        </Field>
        <Field label="Documento / Cedula / RIF">
          <Input name="document" value={draft.document} onChange={(event) => updateDraft("document", event.target.value)} placeholder="J-00000000-0" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefono">
          <Input name="phone" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} placeholder="+58 412-000-0000" required />
        </Field>
        <Field label="Cobrador asignado">
          <Select name="sellerId" defaultValue={collectors[0]?.id}>
            {collectors.map((collector) => (
              <option key={collector.id} value={collector.id}>{collector.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Ruta asignada">
        <Select name="routeId" defaultValue={routes[0]?.id ?? ""}>
          <option value="">Sin ruta por ahora</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>{route.name}</option>
          ))}
        </Select>
      </Field>
      <Field label="Direccion tienda">
        <Textarea name="address" value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} placeholder="Direccion exacta del local" required />
      </Field>
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4 text-brand-500" /> Ubicacion tienda
          </div>
          <Button type="button" variant="secondary" onClick={() => captureLocation("store")} disabled={isLocating !== null}>
            {isLocating === "store" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
            Usar GPS tienda
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitud tienda">
            <Input name="storeLatitude" value={draft.storeLatitude} onChange={(event) => updateDraft("storeLatitude", event.target.value)} type="number" step="0.0000001" placeholder="10.5006000" />
          </Field>
          <Field label="Longitud tienda">
            <Input name="storeLongitude" value={draft.storeLongitude} onChange={(event) => updateDraft("storeLongitude", event.target.value)} type="number" step="0.0000001" placeholder="-66.9146000" />
          </Field>
        </div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">Residencia / segunda ubicacion</p>
          <Button type="button" variant="secondary" onClick={() => captureLocation("secondary")} disabled={isLocating !== null}>
            {isLocating === "secondary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
            Usar GPS residencia
          </Button>
        </div>
        <Field label="Direccion residencia">
          <Input name="secondaryAddress" value={draft.secondaryAddress} onChange={(event) => updateDraft("secondaryAddress", event.target.value)} placeholder="Casa, residencia o punto alterno" />
        </Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Latitud residencia">
            <Input name="secondaryLatitude" value={draft.secondaryLatitude} onChange={(event) => updateDraft("secondaryLatitude", event.target.value)} type="number" step="0.0000001" placeholder="10.5021000" />
          </Field>
          <Field label="Longitud residencia">
            <Input name="secondaryLongitude" value={draft.secondaryLongitude} onChange={(event) => updateDraft("secondaryLongitude", event.target.value)} type="number" step="0.0000001" placeholder="-66.9161000" />
          </Field>
        </div>
        {gpsStatus ? <p className="mt-3 text-sm text-zinc-300">{gpsStatus}</p> : null}
      </div>
      <Field label="Notas">
        <Textarea name="notes" value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="Referencia, horario, condiciones de credito o indicaciones internas" />
      </Field>
      <Button type="submit">
        <Plus className="h-4 w-4" /> Crear cliente
      </Button>
    </form>
  );
}
