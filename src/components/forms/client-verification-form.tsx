import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import type { Client } from "@/lib/types";
import { verifyClientAction } from "@/server/actions/client-actions";

export function ClientVerificationForm({
  client,
  missingRequiredDocuments,
  documentsError
}: {
  client: Client;
  missingRequiredDocuments: string[];
  documentsError: boolean;
}) {
  if (client.status !== "PENDING") return null;

  return (
    <div className="surface rounded-lg p-4 sm:p-5">
      <h2 className="text-lg font-bold text-white">Verificacion del cliente</h2>
      <p className="mt-1 text-sm text-zinc-400">Aprueba el cliente cuando documentos y datos basicos esten correctos.</p>
      {documentsError ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
          No se pudo aprobar: faltan documentos obligatorios del pais del cliente.
        </p>
      ) : null}
      {missingRequiredDocuments.length > 0 ? (
        <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          Para habilitar la aprobacion, carga: {missingRequiredDocuments.join(", ")}.
        </p>
      ) : null}
      <form action={verifyClientAction} className="mt-4 grid gap-4">
        <input type="hidden" name="clientId" value={client.id} />
        <Field label="Observacion de revision">
          <Textarea name="notes" placeholder="Ejemplo: datos confirmados por supervisor" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="submit" name="decision" value="APPROVE" disabled={missingRequiredDocuments.length > 0}>
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
