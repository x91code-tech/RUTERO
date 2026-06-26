import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = ComponentPropsWithoutRef<"section"> & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return <section className={cn("surface min-w-0 max-w-full rounded-lg p-4 sm:p-5", className)} {...props}>{children}</section>;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
