"use client";

import { useMemo, useState } from "react";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatters";
import type { Client, Company } from "@/lib/types";
import { createLoanAction } from "@/server/actions/financial-actions";

type LoanFormProps = {
  clients: Client[];
  company: Company;
  defaultClientId?: string;
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function LoanForm({ clients, company, defaultClientId }: LoanFormProps) {
  const [principalAmount, setPrincipalAmount] = useState(100);
  const [interestRatePercent, setInterestRatePercent] = useState(20);
  const [termDays, setTermDays] = useState(20);
  const activeClients = clients.filter((client) => client.status === "ACTIVE");
  const selectableClients = activeClients.length ? activeClients : clients;
  const selectedClientId = defaultClientId ?? selectableClients[0]?.id ?? "";

  const totals = useMemo(() => {
    const principal = Number.isFinite(principalAmount) ? principalAmount : 0;
    const interestRate = Number.isFinite(interestRatePercent) ? interestRatePercent / 100 : 0;
    const days = Math.max(Number.isFinite(termDays) ? termDays : 1, 1);
    const interestAmount = roundMoney(principal * interestRate);
    const totalAmount = roundMoney(principal + interestAmount);

    return {
      interestAmount,
      totalAmount,
      dailyPayment: roundMoney(totalAmount / days)
    };
  }, [principalAmount, interestRatePercent, termDays]);

  return (
    <form action={createLoanAction} className="grid gap-4">
      <Field label="Cliente">
        <Select name="clientId" defaultValue={selectedClientId} disabled={Boolean(defaultClientId)}>
          {selectableClients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </Select>
        {defaultClientId ? <input type="hidden" name="clientId" value={defaultClientId} /> : null}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor de venta / prestamo">
          <Input name="principalAmount" type="number" value={principalAmount} min="0" step="0.01" onChange={(event) => setPrincipalAmount(Number(event.target.value))} />
        </Field>
        <Field label="Interes %">
          <Input name="interestRatePercent" type="number" value={interestRatePercent} min="0" max="100" step="0.01" onChange={(event) => setInterestRatePercent(Number(event.target.value))} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_1.4fr]">
        <Field label="Cuotas diarias">
          <div className="grid grid-cols-[3rem_1fr_3rem] overflow-hidden rounded-xl border border-white/10">
            <button type="button" className="bg-brand-500 text-2xl font-black text-carbon-950" onClick={() => setTermDays((value) => Math.max(value - 1, 1))}>-</button>
            <Input name="termDays" type="number" value={termDays} min="1" step="1" className="rounded-none border-0 text-center text-xl font-black" onChange={(event) => setTermDays(Number(event.target.value))} />
            <button type="button" className="bg-brand-500 text-2xl font-black text-carbon-950" onClick={() => setTermDays((value) => value + 1)}>+</button>
          </div>
        </Field>
        <Field label="Fecha de inicio">
          <Input name="startDate" type="date" defaultValue={todayInputValue()} />
        </Field>
      </div>

      <div className="grid gap-3 rounded-xl border border-brand-500/25 bg-brand-500/10 p-4 text-sm sm:grid-cols-3">
        <Preview label="Interes" value={formatCurrency(totals.interestAmount, company)} />
        <Preview label="Total a cobrar" value={formatCurrency(totals.totalAmount, company)} />
        <Preview label="Valor cuota" value={formatCurrency(totals.dailyPayment, company)} highlight />
      </div>

      <Field label="Notas">
        <Textarea name="notes" placeholder="Condiciones, referencia o acuerdo con el cliente" />
      </Field>

      <Button type="submit">
        <Landmark className="h-4 w-4" />
        Registrar venta / prestamo
      </Button>
    </form>
  );
}

function Preview({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-zinc-400">{label}</p>
      <p className={`mt-1 text-lg font-black ${highlight ? "text-brand-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
