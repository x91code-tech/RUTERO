"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { getDefaultInterestPercent, getDefaultTermDays, paymentFrequencyOptions } from "@/lib/company-settings";
import { formatCurrency } from "@/lib/formatters";
import type { Client, Company, Loan } from "@/lib/types";
import { createRenewalLoanAction } from "@/server/actions/financial-actions";

type LoanRenewalFormProps = {
  client: Client;
  company: Company;
  loan: Loan;
};

function tomorrowInputValue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

export function LoanRenewalForm({ client, company, loan }: LoanRenewalFormProps) {
  const [principalAmount, setPrincipalAmount] = useState(Math.max(loan.balance, loan.principalAmount));
  const [interestRatePercent, setInterestRatePercent] = useState(getDefaultInterestPercent(company.defaultInterestRate));
  const [termDays, setTermDays] = useState(getDefaultTermDays(company.defaultTermDays));
  const currentBalance = Math.max(loan.balance, 0);

  const totals = useMemo(() => {
    const principal = Math.max(Number.isFinite(principalAmount) ? principalAmount : 0, 0);
    const interestRate = Math.max(Number.isFinite(interestRatePercent) ? interestRatePercent / 100 : 0, 0);
    const days = Math.max(Number.isFinite(termDays) ? termDays : 1, 1);
    const interestAmount = roundMoney(principal * interestRate);
    const totalAmount = roundMoney(principal + interestAmount);
    const disbursedAmount = roundMoney(Math.max(principal - currentBalance, 0));

    return {
      disbursedAmount,
      discountedBalance: Math.min(currentBalance, principal),
      interestAmount,
      totalAmount,
      dailyPayment: roundMoney(totalAmount / days)
    };
  }, [currentBalance, interestRatePercent, principalAmount, termDays]);

  return (
    <form action={createRenewalLoanAction} className="grid gap-4 rounded-xl border border-brand-500/20 bg-brand-500/10 p-4">
      <input type="hidden" name="clientId" value={client.id} />
      <input type="hidden" name="loanId" value={loan.id} />

      <div>
        <p className="text-sm font-black text-white">Renovar prestamo</p>
        <p className="mt-1 text-xs text-zinc-400">
          El saldo actual se descuenta del nuevo capital. La caja solo baja por el efectivo neto entregado.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nuevo capital">
          <Input name="principalAmount" type="number" value={principalAmount} min="0" step="0.01" onChange={(event) => setPrincipalAmount(Number(event.target.value))} />
        </Field>
        <Field label="Interes %">
          <Input name="interestRatePercent" type="number" value={interestRatePercent} min="0" max="100" step="0.01" onChange={(event) => setInterestRatePercent(Number(event.target.value))} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Numero de cuotas">
          <Input name="termDays" type="number" value={termDays} min="1" step="1" onChange={(event) => setTermDays(Number(event.target.value))} />
        </Field>
        <Field label="Frecuencia">
          <Select name="paymentFrequency" defaultValue={company.paymentFrequency ?? "DAILY"}>
            {paymentFrequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Fecha de inicio">
        <Input name="startDate" type="date" defaultValue={tomorrowInputValue()} />
      </Field>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <Preview label="Saldo que se descuenta" value={formatCurrency(totals.discountedBalance, company)} />
        <Preview label="Efectivo a entregar" value={formatCurrency(totals.disbursedAmount, company)} highlight />
        <Preview label="Ganancia nueva" value={formatCurrency(totals.interestAmount, company)} />
        <Preview label="Nueva cuota" value={formatCurrency(totals.dailyPayment, company)} highlight />
        <Preview label="Total nuevo" value={formatCurrency(totals.totalAmount, company)} />
      </div>

      <Field label="Notas">
        <Textarea name="notes" placeholder="Condiciones de la renovacion" />
      </Field>

      <Button type="submit">
        <RefreshCw className="h-4 w-4" />
        Renovar prestamo
      </Button>
    </form>
  );
}

function Preview({ highlight = false, label, value }: { highlight?: boolean; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-carbon-950/45 p-3">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className={highlight ? "mt-1 text-lg font-black text-brand-300" : "mt-1 text-lg font-black text-white"}>{value}</p>
    </div>
  );
}

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}
