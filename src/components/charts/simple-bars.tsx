import { formatCurrency } from "@/lib/formatters";
import type { CurrencyConfig } from "@/lib/countries";

export function SimpleBars({ data, currencyConfig }: { data: { label: string; value: number }[]; currencyConfig?: Partial<CurrencyConfig> }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-zinc-300">{item.label}</span>
            <span className="font-semibold text-white">{formatCurrency(item.value, currencyConfig)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
