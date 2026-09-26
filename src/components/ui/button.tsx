import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-brand-500 text-white shadow-sm shadow-black/20 hover:bg-brand-600",
  secondary: "border border-white/10 bg-carbon-850 text-zinc-100 hover:border-white/20 hover:bg-carbon-800",
  ghost: "text-zinc-300 hover:bg-white/5 hover:text-white",
  danger: "bg-rose-600 text-white hover:bg-rose-700"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn("focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45", variants[variant], className)}
      {...props}
    />
  );
}

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
};

export function LinkButton({ className, href, variant = "primary", children, ...props }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn("focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors active:scale-[0.99]", variants[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
