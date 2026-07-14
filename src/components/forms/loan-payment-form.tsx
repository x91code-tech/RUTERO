"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import { AlertTriangle, Banknote, CheckCircle2, SlidersHorizontal } from "lucide-react";
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
  disabledReason?: string;
};

export function LoanPaymentForm({ clientId, loan, company, paidToday = 0, compact = false, disabledReason }: LoanPaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const allowDuplicateSubmitRef = useRef(false);
  const dailyDue = Math.max(Math.min(loan.dailyPayment, loan.balance) - paidToday, 0);
  const advanceAmount = Math.min(loan.dailyPayment * 2, loan.balance);
  const [mode, setMode] = useState<PaymentMode>("daily");
  const [customAmount, setCustomAmount] = useState(dailyDue || Math.min(loan.dailyPayment, loan.balance));
  const [paymentMethod, setPaymentMethod] = useState(getPaymentMethodsForCountry(company.countryCode)[0]?.code ?? "CASH_LOCAL");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const selectedAmount = useMemo(() => {
    if (mode === "daily") return dailyDue || Math.min(loan.dailyPayment, loan.balance);
    if (mode === "advance") return advanceAmount;
    if (mode === "full") return loan.balance;
    return Math.max(customAmount, 0);
  }, [advanceAmount, customAmount, dailyDue, loan.balance, loan.dailyPayment, mode]);
  const safeAmount = Math.max(selectedAmount, 0);
  const paymentType = mode === "advance" ? "ADVANCE" : mode === "full" ? "SETTLEMENT" : mode === "custom" ? "MANUAL" : "INSTALLMENT";
  const submitLabel = mode === "full" ? (compact ? "Liquidar" : "Liquidar prestamo") : compact ? "Recaudar" : `Recaudar ${formatCurrency(safeAmount, company)}`;
  const isDailyPaymentAlreadyCovered = paidToday >= Math.min(loan.dailyPayment, loan.balance);
  const submitDisabled = safeAmount <= 0 || Boolean(disabledReason);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (disabledReason) {
      event.preventDefault();
      return;
    }
    if (allowDuplicateSubmitRef.current) {
      allowDuplicateSubmitRef.current = false;
      return;
    }
    if (mode === "daily" && isDailyPaymentAlreadyCovered) {
      event.preventDefault();
      setShowDuplicateModal(true);
    }
  };
  const confirmDuplicatePayment = () => {
    allowDuplicateSubmitRef.current = true;
    setShowDuplicateModal(false);
    formRef.current?.requestSubmit();
  };

  if (compact) {
    return (
      <form ref={formRef} action={createCollectionAction} onSubmit={handleSubmit} className="relative grid gap-2 rounded-2xl border border-white/10 bg-carbon-950/35 p-2">
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
            <p className="truncate text-[0.62rem] font-semibold uppercase leading-3 text-zinc-500">Monto a recaudar</p>
            <p className="mt-0.5 truncate text-base font-black text-brand-300">{formatCurrency(safeAmount, company)}</p>
          </div>
          <Button className="min-h-10 px-2 text-xs" type="submit" disabled={submitDisabled}>
            {mode === "full" ? <CheckCircle2 className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
            {disabledReason ? "Caja cerrada" : submitLabel}
          </Button>
        </div>
        {disabledReason ? <p className="rounded-md bg-amber-400/10 px-2 py-1 text-xs text-amber-100">{disabledReason}</p> : null}

        {mode === "custom" ? (
          <Input className="h-9" type="number" value={customAmount} min="0" step="0.01" onChange={(event) => setCustomAmount(Number(event.target.value))} />
        ) : null}

        <details className="group rounded-xl border border-white/10 bg-white/[0.035]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-xs font-semibold text-zinc-300">
            <span className="flex min-w-0 items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-brand-300" />
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
        <DuplicatePaymentModal
          amount={safeAmount}
          company={company}
          open={showDuplicateModal}
          onCancel={() => setShowDuplicateModal(false)}
          onConfirm={confirmDuplicatePayment}
        />
      </form>
    );
  }

  return (
    <form ref={formRef} action={createCollectionAction} onSubmit={handleSubmit} className="relative grid gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-app">
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
        <div className="rounded-2xl bg-carbon-900/70 p-3">
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

      {disabledReason ? <p className="rounded-md bg-amber-400/10 px-3 py-2 text-sm text-amber-100">{disabledReason}</p> : null}

      <Button type="submit" disabled={submitDisabled}>
        {mode === "full" ? <CheckCircle2 className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
        {disabledReason ? "Caja cerrada" : submitLabel}
      </Button>
      <DuplicatePaymentModal
        amount={safeAmount}
        company={company}
        open={showDuplicateModal}
        onCancel={() => setShowDuplicateModal(false)}
        onConfirm={confirmDuplicatePayment}
      />
    </form>
  );
}

function DuplicatePaymentModal({
  amount,
  company,
  onCancel,
  onConfirm,
  open
}: {
  amount: number;
  company: Company;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 px-3 pb-3 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-carbon-900 p-4 shadow-app sm:rounded-3xl sm:p-5">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15 sm:hidden" />
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Cuota ya pagada</h2>
            <p className="mt-1 text-sm text-zinc-300">
              Esta cuota ya aparece como pagada hoy. Puedes agregar otro pago si el cliente esta adelantando o abonando extra.
            </p>
            <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2 text-sm text-zinc-300">
              Nuevo pago: <span className="font-black text-brand-300">{formatCurrency(amount, company)}</span>
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button type="button" onClick={onConfirm}>Agregar pago</Button>
        </div>
      </div>
    </div>
  );
}

function ModeButton({ active, compact = false, label, onClick }: { active: boolean; compact?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`${compact ? "rounded-xl px-1.5 py-1 text-[0.68rem]" : "rounded-xl px-3 py-2 text-sm"} border font-semibold transition active:scale-[0.99] ${active ? "border-brand-500 bg-brand-500 text-white shadow-glow" : "border-white/10 bg-white/[0.045] text-zinc-300 hover:bg-white/[0.08]"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
