"use client";

import { useMemo, useState } from "react";
import { Banknote, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { formatCurrency, paymentMethodLabel } from "@/lib/formatters";
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

  if (compact) {
    return (
      <form action={createCollectionAction} className="grid gap-2 rounded-lg border border-white/10 bg-carbon-950/35 p-2">
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="loanId" value={loan.id} />
        <input type="hidden" name="amount" value={safeAmount.toFixed(2)} />
        <input type="hidden" name="paymentType" value={paymentType} />
        <input type="hidden" name="application" value="NORMAL" />
        <input type="hidden" name="paymentMethod" value={paymentMethod} />

        <div className="grid grid-cols-4 gap-1">
          <ModeButton active={mode === "daily"} compact onClick={() => setMode("daily")} label="Cuota" />
          <ModeButton active={mode === "advance"} compact onClick={() => setMode("advance")} label="Adelanto" />
          <ModeButton active={mode === "full"} compact onClick={() => setMode("full")} label="Todo" />
          <ModeButton active={mode === "custom"} compact onClick={() => setMode("custom")} label="Manual" />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2">
          <div className="rounded-lg bg-carbon-900/70 px-2 py-1.5">
            <p className="truncate text-[0.62rem] font-semibold uppercase leading-3 text-zinc-500">Monto a cobrar</p>
            <p className="mt-0.5 truncate text-base font-black text-brand-300">{formatCurrency(safeAmount, company)}</p>
          </div>
          <Button className="min-h-10 px-2 text-xs" type="submit" disabled={safeAmount <= 0}>
            {mode === "full" ? <CheckCircle2 className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
            {submitLabel}
          </Button>
        </div>

        {mode === "custom" ? (
          <Input className="h-9" type="number" value={customAmount} min="0" step="0.01" onChange={(event) => setCustomAmount(Number(event.target.value))} />
        ) : null}

        <details className="group rounded-lg border border-white/10 bg-white/[0.03]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-xs font-semibold text-zinc-300">
            <span className="flex min-w-0 items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-brand-400" />
              <span className="truncate">{paymentMethodLabel(paymentMethod, company.countryCode)}</span>
            </span>
            <span className="text-zinc-500 group-open:hidden">Opciones</span>
            <span className="hidden text-zinc-500 group-open:inline">Cerrar</span>
          </summary>
          <div className="grid gap-2 border-t border-white/10 p-2">
            <Select className="h-9 min-w-0" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} aria-label="Metodo de pago">
              {getPaymentMethodsForCountry(company.countryCode)
                .filter((method) => method.category !== "credit")
                .map((method) => <option key={method.code} value={method.code}>{method.label}</option>)}
            </Select>
            <Input name="observation" className="h-9" placeholder="Nota opcional" />
          </div>
        </details>
      </form>
    );
  }

  return (
    <form action={createCollectionAction} className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="loanId" value={loan.id} />
      <input type="hidden" name="amount" value={safeAmount.toFixed(2)} />
      <input type="hidden" name="paymentType" value={paymentType} />
      <input type="hidden" name="application" value="NORMAL" />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ModeButton active={mode === "daily"} onClick={() => setMode("daily")} label="Cuota" />
        <ModeButton active={mode === "advance"} onClick={() => setMode("advance")} label="Adelanto" />
        <ModeButton active={mode === "full"} onClick={() => setMode("full")} label="Todo" />
        <ModeButton active={mode === "custom"} onClick={() => setMode("custom")} label="Manual" />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
        <div className="rounded-lg bg-carbon-900/70 p-3">
          <p className="truncate text-[0.65rem] font-semibold uppercase leading-3 text-zinc-500">Monto</p>
          <p className="mt-1 text-xl font-black text-brand-300">{formatCurrency(safeAmount, company)}</p>
        </div>
        <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} aria-label="Metodo de pago">
          {getPaymentMethodsForCountry(company.countryCode)
            .filter((method) => method.category !== "credit")
            .map((method) => <option key={method.code} value={method.code}>{method.label}</option>)}
        </Select>
      </div>

      {mode === "custom" ? (
        <Input type="number" value={customAmount} min="0" step="0.01" onChange={(event) => setCustomAmount(Number(event.target.value))} />
      ) : null}

      <Textarea name="observation" placeholder="Nota del pago, adelanto o liquidacion" />

      <Button type="submit" disabled={safeAmount <= 0}>
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
