import { cn } from "@/lib/utils";

const toneClasses = {
  green: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300",
  red: "border-rose-500/20 bg-rose-500/[0.08] text-rose-300",
  orange: "border-brand-500/25 bg-brand-500/[0.08] text-brand-200",
  gray: "border-white/10 bg-white/[0.04] text-zinc-300",
  blue: "border-sky-500/20 bg-sky-500/[0.08] text-sky-300"
};

export function StatusBadge({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof toneClasses }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold leading-none", toneClasses[tone])}>{children}</span>;
}
