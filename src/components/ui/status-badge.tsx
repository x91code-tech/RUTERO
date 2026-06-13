import { cn } from "@/lib/utils";

const toneClasses = {
  green: "bg-emerald-500/15 text-emerald-300",
  red: "bg-red-500/15 text-red-300",
  orange: "bg-orange-500/15 text-orange-300",
  gray: "bg-zinc-500/15 text-zinc-300",
  blue: "bg-sky-500/15 text-sky-300"
};

export function StatusBadge({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof toneClasses }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", toneClasses[tone])}>{children}</span>;
}
