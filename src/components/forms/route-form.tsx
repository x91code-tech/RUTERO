import { RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { User } from "@/lib/types";
import { createRouteAction } from "@/server/actions/route-actions";

export function RouteForm({ users }: { users: User[] }) {
  const collectors = users.filter((user) => user.role === "SELLER" || user.role === "SUPERVISOR");

  return (
    <form action={createRouteAction} className="grid gap-4">
      <Field label="Nombre de ruta">
        <Input name="name" placeholder="Ruta Oeste" required />
      </Field>
      <Field label="Zona">
        <Input name="zone" placeholder="Oeste / Centro / Norte" required />
      </Field>
      <Field label="Cobrador asignado">
        <Select name="sellerId" defaultValue={collectors[0]?.id ?? ""}>
          <option value="">Sin asignar</option>
          {collectors.map((collector) => (
            <option key={collector.id} value={collector.id}>{collector.name}</option>
          ))}
        </Select>
      </Field>
      <Button type="submit">
        <RouteIcon className="h-4 w-4" /> Crear ruta
      </Button>
    </form>
  );
}
