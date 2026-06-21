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
    <div className="surface rounded-lg p-3.5">
      <div className="flex items-center justify-between gap-4">
        <p className="truncate text-sm text-zinc-400">{label}</p>
        {icon ? <span className="text-brand-500">{icon}</span> : null}
      </div>
      <p className={cn("mt-2 truncate text-xl font-black", tones[tone])}>{value}</p>
    </div>
  );
}
