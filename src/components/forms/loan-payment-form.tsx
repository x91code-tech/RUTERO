"use client";

import { useMemo, useState } from "react";
import { Banknote, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";
import { getPaymentMethodsForCountry } from "@/lib/payment-methods";
import type { Company, Loan } from "@/lib/types";
import { createCollectionAction } from "@/server/actions/financial-actions";

type PaymentMode = "daily" | "advance" | "full" | "custom";

type LoanPaymentFormProps = {
  clientId: string;
  loan: Loan;
  company: Company;
  paidToday?: number;
  compact?: boolean;
};

export function LoanPaymentForm({ clientId, loan, company, paidToday = 0, compact = false }: LoanPaymentFormProps) {
  const dailyDue = Math.max(Math.min(loan.dailyPayment, loan.balance) - paidToday, 0);
  const advanceAmount = Math.min(loan.dailyPayment * 2, loan.balance);
  const [mode, setMode] = useState<PaymentMode>("daily");
  const [customAmount, setCustomAmount] = useState(dailyDue || Math.min(loan.dailyPayment, loan.balance));
  const [paymentMethod, setPaymentMethod] = useState(getPaymentMethodsForCountry(company.countryCode)[0]?.code ?? "CASH_LOCAL");

  const selectedAmount = useMemo(() => {
    if (mode === "daily") return dailyDue || Math.min(loan.dailyPayment, loan.balance);
    if (mode === "advance") return advanceAmount;
    if (mode === "full") return loan.balance;
    return Math.max(customAmount, 0);
  }, [advanceAmount, customAmount, dailyDue, loan.balance, loan.dailyPayment, mode]);
  const safeAmount = Math.max(selectedAmount, 0);
  const paymentType = mode === "advance" ? "ADVANCE" : mode === "full" ? "SETTLEMENT" : mode === "custom" ? "MANUAL" : "INSTALLMENT";
  const submitLabel = mode === "full" ? (compact ? "Liquidar" : "Liquidar prestamo") : compact ? "Cobrar" : `Cobrar ${formatCurrency(safeAmount, company)}`;

  return (
    <form action={createCollectionAction} className={compact ? "grid gap-2 rounded-lg border border-white/10 bg-carbon-950/35 p-2" : "grid gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4"}>
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="loanId" value={loan.id} />
      <input type="hidden" name="amount" value={safeAmount.toFixed(2)} />
      <input type="hidden" name="paymentType" value={paymentType} />
      <input type="hidden" name="application" value="NORMAL" />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      <div className={compact ? "grid grid-cols-4 gap-1" : "grid grid-cols-2 gap-2 sm:grid-cols-4"}>
        <ModeButton active={mode === "daily"} compact={compact} onClick={() => setMode("daily")} label="Cuota" />
        <ModeButton active={mode === "advance"} compact={compact} onClick={() => setMode("advance")} label="Adelanto" />
        <ModeButton active={mode === "full"} compact={compact} onClick={() => setMode("full")} label="Todo" />
        <ModeButton active={mode === "custom"} compact={compact} onClick={() => setMode("custom")} label="Manual" />
      </div>

      <div className={compact ? "grid grid-cols-[minmax(0,1fr)_minmax(7rem,0.9fr)] gap-2" : "grid gap-3 sm:grid-cols-[1fr_1fr]"}>
        <div className={compact ? "rounded-lg bg-carbon-900/70 p-2" : "rounded-lg bg-carbon-900/70 p-3"}>
          <p className="truncate text-[0.65rem] font-semibold uppercase leading-3 text-zinc-500">Monto</p>
          <p className={compact ? "mt-1 truncate text-base font-black text-brand-300" : "mt-1 text-xl font-black text-brand-300"}>{formatCurrency(safeAmount, company)}</p>
        </div>
        <Select className={compact ? "min-w-0" : undefined} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} aria-label="Metodo de pago">
          {getPaymentMethodsForCountry(company.countryCode)
            .filter((method) => method.category !== "credit")
            .map((method) => <option key={method.code} value={method.code}>{method.label}</option>)}
        </Select>
      </div>

      {mode === "custom" ? (
        <Input className={compact ? "h-9" : undefined} type="number" value={customAmount} min="0" step="0.01" onChange={(event) => setCustomAmount(Number(event.target.value))} />
      ) : null}

      {!compact ? (
        <Textarea name="observation" placeholder="Nota del pago, adelanto o liquidacion" />
      ) : (
        <input type="hidden" name="observation" value={mode === "full" ? "Pago total del prestamo" : mode === "advance" ? "Pago adelantado de cuotas" : "Pago registrado"} />
      )}

      <Button className={compact ? "min-h-9 text-xs" : undefined} type="submit" disabled={safeAmount <= 0}>
        {mode === "full" ? <CheckCircle2 className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
        {submitLabel}
      </Button>
    </form>
  );
}

function ModeButton({ active, compact = false, label, onClick }: { active: boolean; compact?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`${compact ? "rounded-md px-1.5 py-1 text-[0.68rem]" : "rounded-lg px-3 py-2 text-sm"} border font-semibold transition ${active ? "border-brand-500 bg-brand-500 text-carbon-950" : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
