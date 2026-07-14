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
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartFrame title="Flujo de caja">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.cashFlow} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
            <CartesianGrid stroke="#ffffff14" vertical={false} />
            <XAxis dataKey="label" stroke="#a1a1aa" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="#71717a" tickFormatter={(value) => compactMoney(Number(value), company)} tickLine={false} axisLine={false} fontSize={12} width={64} />
            <Tooltip content={<MoneyTooltip company={company} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="entrada" name="Entrada" radius={[6, 6, 0, 0]} fill="#34d399" />
            <Bar dataKey="salida" name="Salida" radius={[6, 6, 0, 0]} fill="#f87171" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame title="Cobradores">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.collectors} layout="vertical" margin={{ left: 8, right: 8, top: 6, bottom: 6 }}>
            <CartesianGrid stroke="#ffffff14" horizontal={false} />
            <XAxis type="number" stroke="#71717a" tickFormatter={(value) => compactMoney(Number(value), company)} tickLine={false} axisLine={false} fontSize={12} />
            <YAxis type="category" dataKey="label" stroke="#a1a1aa" tickLine={false} axisLine={false} fontSize={12} width={96} />
            <Tooltip content={<MoneyTooltip company={company} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="esperado" name="Esperado" radius={[0, 6, 6, 0]} fill="#f59e0b" />
            <Bar dataKey="cobrado" name="Recaudo" radius={[0, 6, 6, 0]} fill="#34d399" />
            <Bar dataKey="entregado" name="Entregado" radius={[0, 6, 6, 0]} fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame title="Cartera activa">
        <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={data.portfolio} dataKey="value" nameKey="label" innerRadius={56} outerRadius={92} paddingAngle={3}>
                {data.portfolio.map((entry, index) => (
                  <Cell key={entry.label} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip content={<MoneyTooltip company={company} />} />
            </PieChart>
          </ResponsiveContainer>
          <LegendList currency company={company} rows={data.portfolio} />
        </div>
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

function MoneyTooltip({
  active,
  company,
  label,
  payload
}: {
  active?: boolean;
  company: Partial<CurrencyConfig>;
  label?: string;
  payload?: { name?: string; value?: number; payload?: { label?: string } }[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-carbon-950/95 p-3 shadow-xl">
      <p className="mb-2 text-sm font-bold text-white">{label ?? payload[0]?.payload?.label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.name} className="flex justify-between gap-4 text-sm">
            <span className="text-zinc-400">{item.name}</span>
            <span className="font-semibold text-white">{formatCurrency(Number(item.value ?? 0), company)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function compactMoney(value: number, company: Partial<CurrencyConfig>) {
  return new Intl.NumberFormat(company.locale ?? "es-VE", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}
