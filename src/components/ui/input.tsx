import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-200">
      {label}
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("focus-ring min-h-9 rounded-lg border border-white/10 bg-white/[0.06] px-2 text-white placeholder:text-zinc-500 text-sm", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("focus-ring min-h-9 rounded-lg border border-white/10 bg-carbon-900 px-2 text-white text-sm", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("focus-ring min-h-24 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-2 text-white placeholder:text-zinc-500 text-sm", className)} {...props} />;
}
