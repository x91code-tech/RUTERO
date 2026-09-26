import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, icon, tone = "neutral" }: { label: string; value: string; icon?: ReactNode; tone?: "neutral" | "green" | "red" | "orange" }) {
  const tones = {
    neutral: "text-white",
    green: "text-emerald-300",
    red: "text-red-300",
    orange: "text-orange-300"
  };

  return (
    <div className="surface rounded-2xl p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
        {icon ? <span className="text-zinc-500 [&>svg]:h-[1.1rem] [&>svg]:w-[1.1rem]">{icon}</span> : null}
      </div>
      <p className={cn("mt-3 truncate text-2xl font-bold leading-tight tracking-[-0.04em] tabular-nums sm:text-[1.7rem]", tones[tone])}>{value}</p>
    </div>
  );
}
