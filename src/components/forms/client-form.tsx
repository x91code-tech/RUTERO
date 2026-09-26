"use client";

import { useRef, useState } from "react";
import { ChevronDown, Crosshair, FileScan, Globe2, Loader2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";
import { getCurrencyConfig } from "@/lib/countries";
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

function documentPlaceholder(type?: string) {
  const placeholders: Record<string, string> = {
    RIF: "J-00000000-0",
    CEDULA: "V-00000000",
    CNPJ: "00.000.000/0000-00",
    CPF: "000.000.000-00",
    EIN: "00-0000000",
    NIT: "000.000.000-0",
    RUC: "0000000000",
    RFC: "XAXX010101000",
    RUT: "00.000.000-0",
    RNC: "000-00000-0",
    DNI: "00000000"
  };
  return type ? placeholders[type] ?? "Numero de documento" : "Numero de documento";
}

export function ClientForm({ routes, users, companyCountryCode }: { routes: Route[]; users: User[]; companyCountryCode: string }) {
  const collectors = users.filter((user) => user.role === "SELLER" || user.role === "SUPERVISOR");
  const [sellerId, setSellerId] = useState(collectors[0]?.id ?? "");
  const [routeId, setRouteId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<ClientDraft>(initialDraft);
  const [scanStatus, setScanStatus] = useState("");
  const [gpsStatus, setGpsStatus] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLocating, setIsLocating] = useState<"store" | "secondary" | null>(null);
  const assignedUser = collectors.find((user) => user.id === sellerId);
  const countryCode = assignedUser?.role === "SELLER" ? assignedUser.countryCode : companyCountryCode;
  const country = getCurrencyConfig({ countryCode });
  const requiredDocuments = country.clientDocumentRequirements.filter((requirement) => requirement.required);
  const primaryDocument = requiredDocuments[0];
  const visibleRoutes = routes.filter((route) => !route.sellerId || !sellerId || route.sellerId === sellerId);

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
      formData.append("countryCode", countryCode);

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
      <div className="flex items-start gap-3 rounded-xl border border-brand-400/20 bg-brand-400/[0.07] p-3.5">
        <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{country.countryName} <span className="font-normal text-zinc-400">· {country.currencyCode} {country.currencyName}</span></p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            Documentos requeridos: {requiredDocuments.map((requirement) => requirement.label).join(", ") || "sin requisitos configurados"}
          </p>
        </div>
        <p className="ml-auto shrink-0 text-xs font-semibold tabular-nums text-zinc-300">{formatCurrency(0, country)}</p>
      </div>

      <details className="group rounded-xl border border-white/10 bg-carbon-950">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-zinc-300 marker:content-none">
          <span className="flex items-center gap-2"><FileScan className="h-4 w-4 text-zinc-500" /> Rellenar datos desde documento <span className="text-xs text-zinc-600">opcional</span></span>
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-white/[0.07] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg text-xs leading-5 text-zinc-500">Toma o sube una foto para proponer datos. Revísalos antes de guardar.</p>
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileScan className="h-4 w-4" />}
              {isScanning ? "Leyendo..." : "Escanear"}
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
      </details>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del cliente">
          <Input name="name" value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Nombre comercial o razon social" required />
        </Field>
        <Field label={primaryDocument ? `Documento principal · ${primaryDocument.label}` : "Documento de identidad"} hint={primaryDocument?.description}>
          <Input name="document" value={draft.document} onChange={(event) => updateDraft("document", event.target.value)} placeholder={documentPlaceholder(primaryDocument?.type)} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefono">
          <Input name="phone" type="tel" autoComplete="tel" value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} placeholder={`${country.phonePrefix} ...`} required />
        </Field>
        <Field label="Cobrador asignado" hint={assignedUser ? `${country.countryName} · ${country.currencyCode}` : "Se usara el pais de la empresa"}>
          <Select name="sellerId" value={sellerId} onChange={(event) => {
            setSellerId(event.target.value);
            setRouteId("");
          }}>
            {collectors.length === 0 ? <option value="">Usar administrador</option> : null}
            {collectors.map((collector) => {
              const collectorCountry = getCurrencyConfig({ countryCode: collector.role === "SELLER" ? collector.countryCode : companyCountryCode });
              return <option key={collector.id} value={collector.id}>{collector.name} · {collectorCountry.countryCode}</option>;
            })}
          </Select>
        </Field>
      </div>
      <Field label="Ruta asignada">
        <Select name="routeId" value={routeId} onChange={(event) => setRouteId(event.target.value)}>
          <option value="">Sin ruta por ahora</option>
          {visibleRoutes.map((route) => (
            <option key={route.id} value={route.id}>{route.name}</option>
          ))}
        </Select>
      </Field>
      <Field label="Direccion tienda">
        <Textarea name="address" value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} placeholder="Direccion exacta del local" required />
      </Field>
      <details className="group rounded-xl border border-white/10 bg-carbon-950">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-zinc-300 marker:content-none">
          <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-400" /> Ubicaciones y GPS <span className="text-xs text-zinc-600">opcional</span></span>
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
        </summary>
        <div className="grid gap-4 border-t border-white/[0.07] p-4">
      <div className="rounded-lg border border-white/10 bg-carbon-950 p-4">
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
      <div className="rounded-lg border border-white/10 bg-carbon-950 p-4">
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
        </div>
      </details>
      <Field label="Notas">
        <Textarea name="notes" value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="Referencia, horario, condiciones de credito o indicaciones internas" />
      </Field>
      <Button type="submit">
        <Plus className="h-4 w-4" /> Crear cliente
      </Button>
    </form>
  );
}
