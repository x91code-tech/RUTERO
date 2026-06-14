"use client";

import { useMemo, useState } from "react";
import { Copy, Download, FileSpreadsheet, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReportActionsProps = {
  report: string;
  whatsappHref: string;
  filenameBase?: string;
};

export function ReportActions({ report, whatsappHref, filenameBase = "rutero-reporte" }: ReportActionsProps) {
  const [copyLabel, setCopyLabel] = useState("Copiar reporte");
  const csvContent = useMemo(() => toCsv(report), [report]);

  async function copyReport() {
    let copied = false;
    try {
      await navigator.clipboard.writeText(report);
      copied = true;
    } catch {
      copied = fallbackCopy(report);
    }

    setCopyLabel(copied ? "Reporte copiado" : "No se pudo copiar");
    window.setTimeout(() => setCopyLabel("Copiar reporte"), 1800);
  }

  function shareWhatsApp() {
    const opened = window.open(whatsappHref, "_blank");
    if (opened) {
      opened.opener = null;
      return;
    }
    window.location.href = whatsappHref;
  }

  function printPdf() {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      downloadBlob(`${filenameBase}.txt`, report, "text/plain;charset=utf-8");
      return;
    }

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Reporte RUTERO</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
            pre { white-space: pre-wrap; font-size: 14px; line-height: 1.5; }
          </style>
        </head>
        <body><pre>${escapeHtml(report)}</pre></body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <Button type="button" onClick={copyReport}>
        <Copy className="h-4 w-4" /> {copyLabel}
      </Button>
      <Button type="button" variant="secondary" onClick={shareWhatsApp}>
        <MessageCircle className="h-4 w-4" /> Compartir por WhatsApp
      </Button>
      <Button type="button" variant="secondary" onClick={printPdf}>
        <Download className="h-4 w-4" /> Descargar PDF
      </Button>
      <Button type="button" variant="secondary" onClick={() => downloadBlob(`${filenameBase}.csv`, csvContent, "text/csv;charset=utf-8")}>
        <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
      </Button>
    </div>
  );
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toCsv(report: string) {
  const rows = report.split("\n").map((line) => `"${line.replaceAll('"', '""')}"`);
  return `Reporte RUTERO\n${rows.join("\n")}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
