import Link from "next/link";
import Image from "next/image";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type RuteroLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
} & Omit<ComponentProps<typeof Link>, "href">;

const sizes = {
  sm: {
    mark: "h-9 w-9"
  },
  md: {
    mark: "h-11 w-11"
  },
  lg: {
    mark: "h-14 w-14"
  }
};

export function RuteroLogo({ href, size = "md", showText = true, className, ...props }: RuteroLogoProps) {
  const content = (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/brand/rutero-logo.png"
        alt="RUTERO"
        width={160}
        height={160}
        priority={size !== "sm"}
        className={cn("shrink-0 object-contain", sizes[size].mark)}
      />
      {showText ? (
        <span className={cn("font-black tracking-normal text-white", size === "lg" ? "text-3xl" : size === "md" ? "text-2xl" : "text-xl")}>
          RUTERO
        </span>
      ) : null}
    </span>
  );

  const logoClassName = cn("inline-flex items-center", className);

  if (href) {
    return (
      <Link href={href} className={logoClassName} {...props}>
        {content}
      </Link>
    );
  }

  return <div className={logoClassName}>{content}</div>;
}
