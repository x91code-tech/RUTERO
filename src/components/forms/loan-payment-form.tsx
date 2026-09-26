"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Banknote, CheckCircle2, ChevronDown, X } from "lucide-react";
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
  clientName?: string;
  paidToday?: number;
  compact?: boolean;
  disabledReason?: string;
};

export function LoanPaymentForm({ clientId, loan, company, clientName, paidToday = 0, compact = false, disabledReason }: LoanPaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const allowDuplicateSubmitRef = useRef(false);
  const dailyDue = Math.max(Math.min(loan.dailyPayment, loan.balance) - paidToday, 0);
  const advanceAmount = Math.min(loan.dailyPayment * 2, loan.balance);
  const [mode, setMode] = useState<PaymentMode>("daily");
  const [customAmount, setCustomAmount] = useState(dailyDue || Math.min(loan.dailyPayment, loan.balance));
  const countryCode = loan.countryCode ?? company.countryCode;
  const [paymentMethod, setPaymentMethod] = useState(getPaymentMethodsForCountry(countryCode)[0]?.code ?? "CASH_LOCAL");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const previousBalanceRef = useRef(loan.balance);

  useEffect(() => {
    if (previousBalanceRef.current === loan.balance) return;
    previousBalanceRef.current = loan.balance;
    setShowPaymentSheet(false);
  }, [loan.balance]);

  useEffect(() => {
    if (!showPaymentSheet) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowPaymentSheet(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showPaymentSheet]);

  const selectedAmount = useMemo(() => {
    if (mode === "daily") return dailyDue || Math.min(loan.dailyPayment, loan.balance);
    if (mode === "advance") return advanceAmount;
    if (mode === "full") return loan.balance;
    return Math.max(customAmount, 0);
  }, [advanceAmount, customAmount, dailyDue, loan.balance, loan.dailyPayment, mode]);
  const safeAmount = Math.max(selectedAmount, 0);
  const paymentType = mode === "advance" ? "ADVANCE" : mode === "full" ? "SETTLEMENT" : mode === "custom" ? "MANUAL" : "INSTALLMENT";
  const submitLabel = mode === "full" ? (compact ? "Liquidar" : "Liquidar prestamo") : compact ? "Recaudar" : `Recaudar ${formatCurrency(safeAmount, loan)}`;
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
      <>
        <Button
          type="button"
          disabled={submitDisabled}
          onClick={() => setShowPaymentSheet(true)}
          className="min-h-11 w-full justify-between rounded-xl px-3.5 text-sm"
        >
          <span className="inline-flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            {disabledReason ? "Caja cerrada" : "Registrar recaudo"}
          </span>
          <span className="tabular-nums">{formatCurrency(safeAmount, loan)}</span>
        </Button>
        {disabledReason ? <p className="px-1 text-[0.68rem] leading-5 text-amber-200">{disabledReason}</p> : null}

        {showPaymentSheet ? createPortal(
          <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/75 px-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowPaymentSheet(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-sheet-title"
              className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-carbon-900 shadow-app sm:rounded-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-carbon-900 px-4 py-3.5 sm:px-5">
                <div>
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-brand-300">Cartera / recaudo</p>
                  <h2 id="payment-sheet-title" className="mt-0.5 text-base font-bold text-white">Registrar pago</h2>
                  {clientName ? <p className="mt-0.5 max-w-64 truncate text-xs text-zinc-500">{clientName}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentSheet(false)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                  aria-label="Cerrar registro de pago"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form ref={formRef} action={createCollectionAction} onSubmit={handleSubmit} className="grid gap-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
                <input type="hidden" name="clientId" value={clientId} />
                <input type="hidden" name="loanId" value={loan.id} />
                <input type="hidden" name="amount" value={safeAmount.toFixed(2)} />
                <input type="hidden" name="paymentType" value={paymentType} />
                <input type="hidden" name="application" value="NORMAL" />
                <input type="hidden" name="paymentMethod" value={paymentMethod} />

                <div className="grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-carbon-950">
                  <PaymentFact label="Saldo actual" value={formatCurrency(loan.balance, loan)} />
                  <PaymentFact label="Cuota" value={formatCurrency(loan.dailyPayment, loan)} />
                  <PaymentFact label="Pagado" value={formatCurrency(loan.paidAmount, loan)} />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-zinc-400">Tipo de pago</p>
                  <div className="grid grid-cols-4 gap-1 rounded-xl bg-carbon-950 p-1">
                    <ModeButton active={mode === "daily"} compact onClick={() => setMode("daily")} label="Cuota" />
                    <ModeButton active={mode === "advance"} compact onClick={() => setMode("advance")} label="Adelanto" />
                    <ModeButton active={mode === "full"} compact onClick={() => setMode("full")} label="Total" />
                    <ModeButton active={mode === "custom"} compact onClick={() => setMode("custom")} label="Manual" />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-carbon-950 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-zinc-500">Valor a recaudar</p>
                      <p className="mt-1 text-2xl font-bold tracking-[-0.04em] tabular-nums text-white">{formatCurrency(safeAmount, loan)}</p>
                    </div>
                    <span className="rounded-lg bg-brand-500/10 px-2.5 py-1.5 text-xs font-semibold text-brand-200">
                      {mode === "daily" ? "1 cuota" : mode === "advance" ? "2 cuotas" : mode === "full" ? "Liquidacion" : "Abono"}
                    </span>
                  </div>
                  {mode === "custom" ? (
                    <Input
                      aria-label="Monto manual"
                      className="mt-3"
                      type="number"
                      value={customAmount}
                      min="0"
                      max={loan.balance}
                      step="0.01"
                      onChange={(event) => setCustomAmount(Number(event.target.value))}
                    />
                  ) : null}
                </div>

                <label className="grid gap-1.5 text-xs font-semibold text-zinc-400">
                  Metodo de pago
                  <Select className="min-h-10" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} aria-label="Metodo de pago">
                    {getPaymentMethodsForCountry(countryCode)
                      .filter((method) => method.category !== "credit")
                      .map((method) => <option key={method.code} value={method.code}>{method.label}</option>)}
                  </Select>
                </label>

                <details className="group rounded-lg border border-white/10">
                  <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between px-3 text-xs font-medium text-zinc-400 marker:content-none">
                    Agregar observacion <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-white/10 p-2.5">
                    <Textarea name="observation" className="min-h-16" placeholder="Nota del pago, adelanto o liquidacion" />
                  </div>
                </details>

                <Button className="min-h-12 w-full" type="submit" disabled={submitDisabled}>
                  {mode === "full" ? <CheckCircle2 className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                  {disabledReason ? "Caja cerrada" : `Confirmar ${formatCurrency(safeAmount, loan)}`}
                </Button>
              </form>
            </section>
            <DuplicatePaymentModal
              amount={safeAmount}
              loan={loan}
              open={showDuplicateModal}
              onCancel={() => setShowDuplicateModal(false)}
              onConfirm={confirmDuplicatePayment}
            />
          </div>,
          document.body
        ) : null}
      </>
    );
  }

  return (
    <form ref={formRef} action={createCollectionAction} onSubmit={handleSubmit} className="relative grid gap-4 rounded-2xl border border-white/10 bg-carbon-900 p-4 shadow-soft sm:p-5">
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
        <div className="rounded-xl border border-white/10 bg-carbon-950 p-3.5">
          <p className="truncate text-[0.65rem] font-semibold uppercase leading-3 text-zinc-500">Monto</p>
          <p className="mt-1 text-xl font-black text-brand-300">{formatCurrency(safeAmount, loan)}</p>
        </div>
        <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} aria-label="Metodo de pago">
          {getPaymentMethodsForCountry(countryCode)
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
        loan={loan}
        open={showDuplicateModal}
        onCancel={() => setShowDuplicateModal(false)}
        onConfirm={confirmDuplicatePayment}
      />
    </form>
  );
}

function PaymentFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2.5 py-2.5 text-center">
      <p className="truncate text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold tabular-nums text-zinc-200">{value}</p>
    </div>
  );
}

function DuplicatePaymentModal({
  amount,
  loan,
  onCancel,
  onConfirm,
  open
}: {
  amount: number;
  loan: Loan;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/75 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:grid sm:place-items-center sm:p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="duplicate-payment-title" className="w-full max-w-md rounded-t-3xl border border-white/10 bg-carbon-900 p-5 shadow-app sm:rounded-2xl sm:p-6">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15 sm:hidden" />
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 id="duplicate-payment-title" className="text-lg font-bold tracking-[-0.02em] text-white">Cuota ya pagada</h2>
            <p className="mt-1 text-sm text-zinc-300">
              Esta cuota ya aparece como pagada hoy. Puedes agregar otro pago si el cliente esta adelantando o abonando extra.
            </p>
            <p className="mt-3 rounded-lg border border-white/10 bg-carbon-950 px-3 py-2 text-sm text-zinc-300">
              Nuevo pago: <span className="font-black text-brand-300">{formatCurrency(amount, loan)}</span>
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
      className={`${compact ? "min-h-10 rounded-xl px-1.5 py-1 text-[0.68rem]" : "min-h-11 rounded-xl px-3 py-2 text-sm"} border font-semibold transition-colors active:scale-[0.99] ${active ? "border-brand-500/50 bg-brand-500/15 text-brand-200" : "border-white/10 bg-carbon-900 text-zinc-400 hover:border-white/20 hover:text-white"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
