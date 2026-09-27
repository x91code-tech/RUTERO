import { AppShell } from "@/components/layout/app-shell";
import { RuteroLogo } from "@/components/brand/rutero-logo";
import { Card, CardHeader } from "@/components/ui/card";

const checks = [
  { label: "Dominio web actual", value: "rutero.fr-host.fr" },
  { label: "Aplicacion", value: "RUTERO" },
  { label: "Color principal", value: "Naranja RUTERO" },
  { label: "Acceso APK", value: "WebView contra dominio configurado" }
];

export default function PlatformBrandPage() {
  return (
    <AppShell title="Marca y dominios" subtitle="Identidad visible, dominio de acceso y activos usados por RUTERO.">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,34rem)_1fr]">
        <Card>
          <CardHeader title="Identidad actual" description="Vista de los elementos principales de marca." />
          <div className="rounded-2xl border border-white/10 bg-carbon-950 p-6">
            <RuteroLogo href="/platform" size="md" />
            <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400">La plataforma usa grafito, negro calido, blanco y naranja como identidad principal.</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Checklist operativo" description="Elementos que deben revisarse antes de publicar o compilar APK." />
          <div className="grid gap-3">
            {checks.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-carbon-950 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{item.label}</p>
                <p className="mt-1 font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
