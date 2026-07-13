import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/20",
  secondary: "border border-white/10 bg-white/[0.07] text-white hover:border-brand-400/40 hover:bg-white/[0.11]",
  ghost: "text-zinc-300 hover:bg-white/[0.08] hover:text-white",
  danger: "bg-rose-500 text-white hover:bg-rose-600"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn("focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45", variants[variant], className)}
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
      className={cn("focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition active:scale-[0.99]", variants[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
