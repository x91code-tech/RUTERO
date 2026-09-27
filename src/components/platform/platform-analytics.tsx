"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type PlatformAnalyticsProps = {
  statusRows: { label: string; value: number; color: string }[];
  planRows: { label: string; value: number }[];
  currencyRows: { label: string; value: number; currencyCode: string }[];
  partnerRows: { label: string; value: number }[];
};

const barColor = "#ff7a1a";
const mutedColor = "#8b837b";

export function PlatformAnalytics({ statusRows, planRows, currencyRows, partnerRows }: PlatformAnalyticsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="surface rounded-2xl p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black tracking-[-0.02em] text-white sm:text-lg">Pulso de suscripciones</h2>
            <p className="mt-1 text-sm text-zinc-400">Estado actual de empresas y riesgo de cobro.</p>
          </div>
          <StatusLegend rows={statusRows} />
        </div>
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusRows} dataKey="value" nameKey="label" innerRadius={62} outerRadius={92} paddingAngle={3}>
                  {statusRows.map((row) => <Cell key={row.label} fill={row.color} />)}
                </Pie>
                <Tooltip content={<CountTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="min-w-0">
            <h3 className="mb-3 text-sm font-bold text-zinc-300">Empresas por plan</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planRows} layout="vertical" margin={{ left: 8, right: 8, top: 6, bottom: 6 }}>
                  <CartesianGrid stroke="#ffffff14" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke={mutedColor} tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis type="category" dataKey="label" width={92} stroke="#b9b0a6" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip content={<CountTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="value" name="Empresas" radius={[0, 7, 7, 0]} fill={barColor} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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

function CountTooltip({
  active,
  label,
  payload
}: {
  active?: boolean;
  label?: string;
  payload?: { name?: string; value?: number; payload?: { label?: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-white/10 bg-carbon-950/95 p-3 shadow-xl">
      <p className="text-sm font-bold text-white">{label ?? item.payload?.label ?? item.name}</p>
      <p className="mt-1 text-sm text-zinc-400">{item.value ?? 0} registros</p>
    </div>
  );
}

function formatBilling(amount: number, currencyCode: string) {
  return `${new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(amount)} ${currencyCode}`;
}
