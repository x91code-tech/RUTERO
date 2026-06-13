import { Banknote, ClipboardCheck, ReceiptText, Users, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LinkButton } from "@/components/ui/button";
import { MetricCard } from "@/components/cards/metric-card";
import { Card, CardHeader } from "@/components/ui/card";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { demoCashbox, demoCollections, demoCompany, demoExpenses, demoSales } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/formatters";

export default function SellerPage() {
  const sellerSales = demoSales.filter((sale) => sale.sellerId === "user_seller");
  const sellerCollections = demoCollections.filter((collection) => collection.sellerId === "user_seller");
  const sellerExpenses = demoExpenses.filter((expense) => expense.sellerId === "user_seller");
  const summary = calculateDailySummary({ cashbox: demoCashbox, sales: sellerSales, collections: sellerCollections, expenses: sellerExpenses });

  return (
    <AppShell title="Dashboard vendedor" subtitle="Acciones rápidas para trabajar en calle sin perder tiempo.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <LinkButton className="min-h-20 text-base" href="/sales"><ReceiptText /> Registrar venta</LinkButton>
        <LinkButton className="min-h-20 text-base" href="/collections"><WalletCards /> Registrar recaudo</LinkButton>
        <LinkButton className="min-h-20 text-base" href="/expenses"><Banknote /> Registrar gasto</LinkButton>
        <LinkButton className="min-h-20 text-base" href="/clients"><Users /> Ver clientes</LinkButton>
        <LinkButton className="min-h-20 text-base" href="/cashbox"><ClipboardCheck /> Cerrar caja</LinkButton>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ventas" value={formatCurrency(summary.salesTotal, demoCompany)} />
        <MetricCard label="Recaudos" value={formatCurrency(summary.collectionsTotal, demoCompany)} />
        <MetricCard label="Gastos" value={formatCurrency(summary.expensesTotal, demoCompany)} tone="orange" />
        <MetricCard label="Efectivo" value={formatCurrency(summary.cashSales + summary.cashCollections, demoCompany)} />
        <MetricCard label="Transferencia" value={formatCurrency(summary.transferTotal, demoCompany)} />
        <MetricCard label="Pix" value={formatCurrency(summary.pixTotal, demoCompany)} />
        <MetricCard label="Caja esperada" value={formatCurrency(summary.expectedCash, demoCompany)} />
        <MetricCard label="Diferencia" value={formatCurrency(summary.difference, demoCompany)} tone={summary.difference === 0 ? "green" : "red"} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Estado de caja" description={summary.statusMessage} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/[0.04] p-4">
            <p className="text-sm text-zinc-400">Caja inicial</p>
            <p className="mt-2 text-xl font-black">{formatCurrency(demoCashbox.initialCash, demoCompany)}</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-4">
            <p className="text-sm text-zinc-400">Efectivo reportado</p>
            <p className="mt-2 text-xl font-black">{formatCurrency(demoCashbox.reportedCash, demoCompany)}</p>
          </div>
          <div className="rounded-xl bg-emerald-500/15 p-4 text-emerald-200">
            <p className="text-sm">Estado</p>
            <p className="mt-2 text-xl font-black">{summary.statusMessage}</p>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
