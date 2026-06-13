import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import type { Route, User } from "@/lib/types";
import { createClientAction } from "@/server/actions/client-actions";

export function ClientForm({ routes, users }: { routes: Route[]; users: User[] }) {
  const sellers = users.filter((user) => user.role === "SELLER" || user.role === "SUPERVISOR");

  return (
    <form action={createClientAction} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del cliente">
          <Input name="name" placeholder="Nombre comercial o razón social" required />
        </Field>
        <Field label="Documento / Cédula / RIF">
          <Input name="document" placeholder="J-00000000-0" required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono">
          <Input name="phone" placeholder="+58 412-000-0000" required />
        </Field>
        <Field label="Vendedor asignado">
          <Select name="sellerId" defaultValue={sellers[0]?.id}>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>{seller.name}</option>
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
      <Field label="Dirección tienda">
        <Textarea name="address" placeholder="Dirección exacta del local o punto de venta" required />
      </Field>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <MapPin className="h-4 w-4 text-brand-500" /> Ubicación tienda
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitud tienda">
            <Input name="storeLatitude" type="number" step="0.0000001" placeholder="10.5006000" />
          </Field>
          <Field label="Longitud tienda">
            <Input name="storeLongitude" type="number" step="0.0000001" placeholder="-66.9146000" />
          </Field>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-3 font-semibold">Segunda ubicación</p>
        <Field label="Dirección secundaria">
          <Input name="secondaryAddress" placeholder="Oficina, depósito o punto de facturación" />
        </Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Latitud secundaria">
            <Input name="secondaryLatitude" type="number" step="0.0000001" placeholder="10.5021000" />
          </Field>
          <Field label="Longitud secundaria">
            <Input name="secondaryLongitude" type="number" step="0.0000001" placeholder="-66.9161000" />
          </Field>
        </div>
      </div>
      <Field label="Notas">
        <Textarea name="notes" placeholder="Referencia, horario, condiciones de crédito o indicaciones internas" />
      </Field>
      <Button type="submit">
        <Plus className="h-4 w-4" /> Crear cliente
      </Button>
    </form>
  );
}
