"use client";

import { ClientErrorBoundary } from "@/components/ui/client-error-boundary";
import type { CurrencyConfig } from "@/lib/countries";
import { formatCurrency } from "@/lib/formatters";

export type AdminAnalyticsData = {
  cashFlow: { label: string; entrada: number; salida: number }[];
  portfolio: { label: string; value: number }[];
  collectors: { label: string; esperado: number; cobrado: number; entregado: number }[];
  paymentMethods: { label: string; value: number }[];
  clientStatus: { label: string; value: number }[];
};

const palette = ["#ff6b13", "#34d399", "#60a5fa", "#f59e0b", "#f87171", "#a3e635"];

export function AdminAnalytics({ company, data }: { company: Partial<CurrencyConfig>; data: AdminAnalyticsData }) {
  return (
    <ClientErrorBoundary fallback={<AnalyticsFallback />}>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartFrame title="Flujo de caja">
          <ComparisonBars
            company={company}
            rows={data.cashFlow.map((row) => ({
              label: row.label,
              values: [
                { label: "Entrada", value: row.entrada, color: "#34d399" },
                { label: "Salida", value: row.salida, color: "#f87171" }
              ]
            }))}
          />
        </ChartFrame>

        <ChartFrame title="Cobradores">
          <ComparisonBars
            company={company}
            rows={data.collectors.map((row) => ({
              label: row.label,
              values: [
                { label: "Esperado", value: row.esperado, color: "#f59e0b" },
                { label: "Recaudo", value: row.cobrado, color: "#34d399" },
                { label: "Entregado", value: row.entregado, color: "#60a5fa" }
              ]
            }))}
          />
        </ChartFrame>

        <ChartFrame title="Cartera activa">
          <LegendList currency company={company} rows={data.portfolio} />
        </ChartFrame>

        <ChartFrame title="Metodos y estado">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-bold text-zinc-300">Dinero recibido</p>
              <LegendList currency company={company} rows={data.paymentMethods} />
            </div>
            <div>
              <p className="mb-3 text-sm font-bold text-zinc-300">Clientes</p>
              <LegendList rows={data.clientStatus} />
            </div>
          </div>
        </ChartFrame>
      </div>
    </ClientErrorBoundary>
  );
}

function AnalyticsFallback() {
  return (
    <section className="surface rounded-lg p-5">
      <h2 className="text-lg font-bold text-white">Analiticas</h2>
      <p className="mt-2 text-sm text-zinc-400">
        No se pudo cargar este bloque de analiticas. Los indicadores y tablas siguen disponibles.
      </p>
    </section>
  );
}

function ChartFrame({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="surface rounded-lg p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function ComparisonBars({
  company,
  rows
}: {
  company: Partial<CurrencyConfig>;
  rows: { label: string; values: { label: string; value: number; color: string }[] }[];
}) {
  const max = Math.max(...rows.flatMap((row) => row.values.map((value) => Math.abs(value.value))), 1);

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl bg-carbon-950/55 p-3">
          <p className="mb-3 truncate text-sm font-bold text-zinc-200">{row.label}</p>
          <div className="space-y-2">
            {row.values.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-500">{item.label}</span>
                  <span className="font-semibold tabular-nums text-white">{formatCurrency(item.value, company)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${(Math.abs(item.value) / max) * 100}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LegendList({
  company,
  currency = false,
  rows
}: {
  company?: Partial<CurrencyConfig>;
  currency?: boolean;
  rows: { label: string; value: number }[];
}) {
  const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1);

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-zinc-300">{row.label}</span>
            <span className="font-semibold text-white">{currency ? formatCurrency(row.value, company) : row.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${(Math.abs(row.value) / max) * 100}%`, backgroundColor: palette[index % palette.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}
