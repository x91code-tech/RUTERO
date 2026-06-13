import { FileCheck2, FileWarning, Upload } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ClientDocument } from "@/lib/types";

const statusLabels = {
  PENDING: "Pendiente",
  UPLOADED: "Cargado",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado"
};

export function ClientDocumentsCard({ documents }: { documents: ClientDocument[] }) {
  return (
    <div className="surface rounded-2xl p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Documentos del país</h2>
          <p className="mt-1 text-sm text-zinc-400">Requisitos según el país configurado para la empresa.</p>
        </div>
        <FileCheck2 className="h-5 w-5 text-brand-500" />
      </div>
      <div className="space-y-3">
        {documents.map((document) => (
          <div key={document.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
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
              <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white">
                <Upload className="h-4 w-4" /> Subir documento
              </button>
              {!document.fileUrl ? (
                <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                  <FileWarning className="h-4 w-4 text-orange-300" /> Sin archivo cargado
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
