import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-semibold text-zinc-200">
      {label}
      {hint ? <span className="-mt-1 text-xs font-normal leading-5 text-zinc-500">{hint}</span> : null}
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("focus-ring min-h-11 w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-carbon-950 px-3.5 text-sm text-white placeholder:text-zinc-500 transition-colors hover:border-white/20 disabled:opacity-50", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("focus-ring min-h-11 w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-carbon-950 px-3.5 text-sm text-white transition-colors hover:border-white/20 disabled:opacity-50", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("focus-ring min-h-24 w-full min-w-0 max-w-full rounded-xl border border-white/10 bg-carbon-950 px-3.5 py-3 text-sm text-white placeholder:text-zinc-500 transition-colors hover:border-white/20 disabled:opacity-50", className)} {...props} />;
}
