import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "RUTERO",
  description: "Control de rutas, ventas, recaudos y caja diaria para equipos en calle.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/brand/rutero-logo.png", type: "image/png" }],
    shortcut: "/brand/rutero-logo.png",
    apple: "/brand/rutero-logo.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
