import { FileCheck2, FileWarning, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ClientDocument } from "@/lib/types";
import { uploadClientDocumentAction } from "@/server/actions/client-actions";

const statusLabels = {
  PENDING: "Pendiente",
  UPLOADED: "Cargado",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado"
};

export function ClientDocumentsCard({ documents }: { documents: ClientDocument[] }) {
  return (
    <div className="surface rounded-lg p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Documentos del pais</h2>
          <p className="mt-1 text-sm text-zinc-400">Requisitos segun el pais configurado para la empresa.</p>
        </div>
        <FileCheck2 className="h-5 w-5 text-brand-500" />
      </div>
      <div className="space-y-3">
        {documents.map((document) => (
          <div key={document.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{document.label}</p>
                <p className="mt-1 text-sm text-zinc-400">{document.notes}</p>
              </div>
              <StatusBadge tone={document.status === "APPROVED" || document.status === "UPLOADED" ? "green" : document.required ? "orange" : "gray"}>
                {document.required ? "Obligatorio" : "Opcional"}
              </StatusBadge>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge tone={document.status === "REJECTED" ? "red" : document.status === "PENDING" ? "orange" : "green"}>
                {statusLabels[document.status]}
              </StatusBadge>
              {!document.fileUrl ? (
                <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                  <FileWarning className="h-4 w-4 text-orange-300" /> Sin archivo cargado
                </span>
              ) : null}
            </div>
            <form action={uploadClientDocumentAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input type="hidden" name="clientId" value={document.clientId} />
              <input type="hidden" name="countryCode" value={document.countryCode} />
              <input type="hidden" name="documentType" value={document.documentType} />
              <input type="hidden" name="label" value={document.label} />
              <input type="hidden" name="required" value={String(document.required)} />
              <input type="hidden" name="notes" value={document.notes ?? ""} />
              <Input name="fileUrl" type="url" placeholder="https://..." defaultValue={document.fileUrl ?? ""} required />
              <Button type="submit" variant="secondary">
                <Upload className="h-4 w-4" /> Guardar
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
