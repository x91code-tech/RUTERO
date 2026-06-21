import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import type { Client } from "@/lib/types";
import { verifyClientAction } from "@/server/actions/client-actions";

export function ClientVerificationForm({ client }: { client: Client }) {
  if (client.status !== "PENDING") return null;

  return (
    <div className="surface rounded-lg p-4 sm:p-5">
      <h2 className="text-lg font-bold text-white">Verificacion del cliente</h2>
      <p className="mt-1 text-sm text-zinc-400">Aprueba el cliente cuando documentos y datos basicos esten correctos.</p>
      <form action={verifyClientAction} className="mt-4 grid gap-4">
        <input type="hidden" name="clientId" value={client.id} />
        <Field label="Observacion de revision">
          <Textarea name="notes" placeholder="Ejemplo: datos confirmados por supervisor" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="submit" name="decision" value="APPROVE">
            <CheckCircle2 className="h-4 w-4" /> Aprobar cliente
          </Button>
          <Button type="submit" name="decision" value="REJECT" variant="danger">
            <XCircle className="h-4 w-4" /> Rechazar
          </Button>
        </div>
      </form>
    </div>
  );
}
