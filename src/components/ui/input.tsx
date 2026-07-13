import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-zinc-200">
      {label}
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("focus-ring min-h-11 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-sm text-white placeholder:text-zinc-500 disabled:opacity-50", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("focus-ring min-h-11 rounded-xl border border-white/10 bg-carbon-900 px-3 text-sm text-white disabled:opacity-50", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("focus-ring min-h-24 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 disabled:opacity-50", className)} {...props} />;
}
