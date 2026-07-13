import { cn } from "@/lib/utils";

const toneClasses = {
  green: "bg-emerald-500/15 text-emerald-300",
  red: "bg-rose-500/15 text-rose-300",
  orange: "bg-amber-400/15 text-amber-200",
  gray: "bg-zinc-500/15 text-zinc-300",
  blue: "bg-cyan-500/15 text-cyan-200"
};

export function StatusBadge({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof toneClasses }) {
  return <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold", toneClasses[tone])}>{children}</span>;
}
