"use client";

import { ClientErrorBoundary } from "@/components/ui/client-error-boundary";

type PlatformAnalyticsProps = {
  statusRows: { label: string; value: number; color: string }[];
  planRows: { label: string; value: number }[];
  currencyRows: { label: string; value: number; currencyCode: string }[];
  partnerRows: { label: string; value: number }[];
};

export function PlatformAnalytics({ statusRows, planRows, currencyRows, partnerRows }: PlatformAnalyticsProps) {
  return (
    <ClientErrorBoundary fallback={<PlatformAnalyticsFallback />}>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="surface rounded-2xl p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black tracking-[-0.02em] text-white sm:text-lg">Pulso de suscripciones</h2>
              <p className="mt-1 text-sm text-zinc-400">Estado actual de empresas y riesgo de cobro.</p>
            </div>
            <StatusLegend rows={statusRows} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <ProgressRows rows={statusRows.map((row) => ({ ...row, valueLabel: `${row.value}` }))} empty="No hay empresas registradas." />
            <div className="min-w-0">
              <h3 className="mb-3 text-sm font-bold text-zinc-300">Empresas por plan</h3>
              <ProgressRows rows={planRows.map((row) => ({ ...row, color: "#ff7a1a", valueLabel: `${row.value}` }))} empty="No hay planes asignados." />
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <MetricPanel title="Mensualidad esperada" description="Suma por moneda de las suscripciones activas configuradas.">
            <ValueRows rows={currencyRows.map((row) => ({
              label: row.label,
              value: formatBilling(row.value, row.currencyCode)
            }))} empty="No hay mensualidades configuradas." />
          </MetricPanel>
          <MetricPanel title="Red comercial" description="Empresas referidas por socio activo.">
            <ValueRows rows={partnerRows.map((row) => ({ label: row.label, value: String(row.value) }))} empty="Todavia no hay empresas referidas." />
          </MetricPanel>
        </div>
      </section>
    </ClientErrorBoundary>
  );
}

function PlatformAnalyticsFallback() {
  return (
    <section className="surface rounded-2xl p-5">
      <h2 className="text-base font-black tracking-[-0.02em] text-white">Analiticas de plataforma</h2>
      <p className="mt-2 text-sm text-zinc-400">
        No se pudo cargar este bloque de analiticas. Las metricas y acciones siguen disponibles.
      </p>
    </section>
  );
}

function MetricPanel({ children, description, title }: { children: React.ReactNode; description: string; title: string }) {
  return (
    <div className="surface rounded-2xl p-4 sm:p-5">
      <h2 className="text-base font-black tracking-[-0.02em] text-white">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-zinc-400">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ProgressRows({
  empty,
  rows
}: {
  empty: string;
  rows: { label: string; value: number; valueLabel: string; color: string }[];
}) {
  if (!rows.length) return <p className="rounded-xl border border-white/10 bg-carbon-950 p-3 text-sm text-zinc-500">{empty}</p>;

  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-white/10 bg-carbon-950 p-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-zinc-300">{row.label}</span>
            <strong className="shrink-0 tabular-nums text-white">{row.valueLabel}</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusLegend({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((row) => (
        <span key={row.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-zinc-300">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
          {row.label}: {row.value}
        </span>
      ))}
    </div>
  );
}

function ValueRows({ empty, rows }: { empty: string; rows: { label: string; value: string }[] }) {
  if (!rows.length) return <p className="rounded-xl border border-white/10 bg-carbon-950 p-3 text-sm text-zinc-500">{empty}</p>;

  return (
    <div className="divide-y divide-white/[0.07] overflow-hidden rounded-xl border border-white/10 bg-carbon-950">
      {rows.map((row) => (
        <div key={`${row.label}-${row.value}`} className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="min-w-0 truncate text-sm text-zinc-300">{row.label}</span>
          <strong className="shrink-0 text-sm tabular-nums text-white">{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

function formatBilling(amount: number, currencyCode: string) {
  return `${new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(amount)} ${currencyCode}`;
}
