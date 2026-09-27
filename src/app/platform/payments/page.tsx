import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { formatBillingAmount } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { formatShortDate } from "@/lib/formatters";
import { requirePlatformOwner } from "@/lib/platform-data";

export default async function PlatformPaymentsPage() {
  await requirePlatformOwner();
  const payments = await prisma.platformPayment.findMany({
    include: {
      company: { select: { name: true } },
      recordedBy: { select: { name: true, email: true } },
      commission: { include: { partner: { include: { user: { select: { name: true } } } } } }
    },
    orderBy: { receivedAt: "desc" },
    take: 80
  });
  const totals = Array.from(payments.reduce((map, payment) => {
    const currency = payment.currencyCode;
    map.set(currency, (map.get(currency) ?? 0) + Number(payment.amount));
    return map;
  }, new Map<string, number>()));

  return (
    <AppShell title="Pagos plataforma" subtitle="Mensualidades registradas, referencias y comisiones generadas.">
      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {totals.length ? totals.map(([currencyCode, amount]) => (
          <Metric key={currencyCode} label={`Total ${currencyCode}`} value={formatBillingAmount(amount, currencyCode)} />
        )) : <Metric label="Pagos registrados" value="0" />}
      </section>

      <Card>
        <CardHeader title="Historial de pagos" description="Ultimos pagos recibidos por cuentas cliente y socios." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-zinc-500">
              <tr className="border-b border-white/10">
                <th className="py-3 pr-4">Fecha</th>
                <th className="py-3 pr-4">Empresa</th>
                <th className="py-3 pr-4">Monto</th>
                <th className="py-3 pr-4">Medio</th>
                <th className="py-3 pr-4">Referencia</th>
                <th className="py-3 pr-4">Comision</th>
                <th className="py-3">Registrado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {payments.map((payment) => (
                <tr key={payment.id} className="align-top text-zinc-300">
                  <td className="py-3 pr-4 text-zinc-500">{formatShortDate(payment.receivedAt)}</td>
                  <td className="py-3 pr-4 font-semibold text-white">{payment.company.name}</td>
                  <td className="py-3 pr-4 tabular-nums">{formatBillingAmount(Number(payment.amount), payment.currencyCode)}</td>
                  <td className="py-3 pr-4">{payment.paymentMethod}{payment.network ? ` / ${payment.network}` : ""}</td>
                  <td className="max-w-[14rem] truncate py-3 pr-4 text-zinc-400">{payment.transactionRef}</td>
                  <td className="py-3 pr-4 text-zinc-400">
                    {payment.commission ? `${formatBillingAmount(Number(payment.commission.amount), payment.commission.currencyCode)} · ${payment.commission.partner.user.name}` : "Sin socio"}
                  </td>
                  <td className="py-3 text-zinc-500">{payment.recordedBy.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!payments.length ? <p className="p-4 text-sm text-zinc-500">Todavia no hay pagos de plataforma.</p> : null}
        </div>
      </Card>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-carbon-900 p-4">
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}
