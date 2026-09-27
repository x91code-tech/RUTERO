import type { SubscriptionPlan } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { recordSubscriptionPaymentAction } from "@/server/actions/platform-actions";

export function RecordPaymentForm({ companyId, subscription }: { companyId: string; subscription: SubscriptionPlan }) {
  return (
    <form action={recordSubscriptionPaymentAction} className="grid gap-4 rounded-xl border border-white/10 bg-carbon-950 p-4 sm:grid-cols-2">
      <input type="hidden" name="companyId" value={companyId} />
      <Field label="Monto recibido"><Input name="amount" type="number" min="0.00000001" step="0.00000001" defaultValue={Number(subscription.billingAmount) || ""} required /></Field>
      <Field label="Moneda"><Input name="currencyCode" defaultValue={subscription.billingCurrency} maxLength={10} required /></Field>
      <Field label="Medio">
        <Select name="paymentMethod" defaultValue="USDT">
          <option value="USDT">USDT</option>
          <option value="CRYPTO">Otra criptomoneda</option>
          <option value="LOCAL_CURRENCY">Moneda local</option>
        </Select>
      </Field>
      <Field label="Meses cubiertos">
        <Select name="periodMonths" defaultValue="1">
          {[1, 2, 3, 6, 12].map((months) => <option key={months} value={months}>{months}</option>)}
        </Select>
      </Field>
      <Field label="Red o detalle del medio (opcional)"><Input name="network" maxLength={60} placeholder="TRC20, ERC20, banco..." /></Field>
      <Field label="Referencia o hash de transaccion"><Input name="transactionRef" minLength={3} maxLength={160} required /></Field>
      <div className="flex items-end sm:col-span-2"><Button type="submit" variant="secondary" className="w-full sm:w-auto">Registrar pago</Button></div>
    </form>
  );
}
