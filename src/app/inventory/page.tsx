import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { demoCompany, demoProducts } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/formatters";

export default function InventoryPage() {
  return (
    <AppShell title="Inventario" subtitle="Productos, costos, precios, stock mínimo y movimientos.">
      <Card>
        <CardHeader title="Productos" description="Base inicial conectable con ventas e inventario." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-zinc-400"><tr><th className="pb-3">Producto</th><th className="pb-3">Precio</th><th className="pb-3">Costo</th><th className="pb-3">Stock</th><th className="pb-3">Estado</th></tr></thead>
            <tbody className="divide-y divide-white/10">
              {demoProducts.map((product) => (
                <tr key={product.id}>
                  <td className="py-4 font-semibold">{product.name}</td>
                  <td>{formatCurrency(product.price, demoCompany)}</td>
                  <td>{formatCurrency(product.cost, demoCompany)}</td>
                  <td>{product.stock} / mín. {product.minStock}</td>
                  <td><StatusBadge tone={product.stock <= product.minStock ? "orange" : "green"}>{product.stock <= product.minStock ? "Stock bajo" : "Activo"}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
