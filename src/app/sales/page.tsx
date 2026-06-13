import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { SaleForm } from "@/components/forms/movement-form";
import { demoClients, demoCompany, demoSales } from "@/lib/demo-data";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";

export default function SalesPage() {
  return (
    <AppShell title="Ventas" subtitle="Registra ventas de contado o crédito con impacto en caja y saldo.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card><CardHeader title="Registrar venta" description="Si es crédito, aumenta el saldo pendiente del cliente." /><SaleForm /></Card>
        <Card>
          <CardHeader title="Ventas recientes" />
          <div className="space-y-3">
            {demoSales.map((sale) => {
              const client = demoClients.find((item) => item.id === sale.clientId);
              return (
                <div key={sale.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-4">
                  <div><p className="font-semibold">{sale.product}</p><p className="text-sm text-zinc-400">{client?.name} · {paymentMethodLabel(sale.paymentMethod)}</p></div>
                  <p className="font-black">{formatCurrency(sale.amount, demoCompany)}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
