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
    mark: "h-9 w-9",
    logo: "h-9 w-auto"
  },
  md: {
    mark: "h-11 w-11",
    logo: "h-11 w-auto"
  },
  lg: {
    mark: "h-14 w-14",
    logo: "h-14 w-auto"
  }
};

export function RuteroLogo({ href, size = "md", showText = true, className, ...props }: RuteroLogoProps) {
  const content = (
    <>
      {showText ? (
        <Image
          src="/brand/rutero-logo.png"
          alt="RUTERO"
          width={520}
          height={160}
          priority={size !== "sm"}
          className={cn("object-contain", sizes[size].logo)}
        />
      ) : (
        <Image
          src="/brand/rutero-isotipo.png"
          alt="RUTERO"
          width={160}
          height={160}
          priority={size !== "sm"}
          className={cn("shrink-0 rounded-2xl object-contain", sizes[size].mark)}
        />
      )}
    </>
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
