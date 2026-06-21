"use client";

import { useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import {
  cashMovementKindDescriptions,
  cashMovementKindLabels,
  cashMovementKinds,
  cashMovementTypeOptions
} from "@/lib/cash-movements";
import type { CountryPaymentMethod } from "@/lib/payment-methods";
import type { CashMovementKind } from "@/lib/types";

export function CashMovementFields({
  defaultDate,
  paymentOptions
}: {
  defaultDate: string;
  paymentOptions: CountryPaymentMethod[];
}) {
  const [movementKind, setMovementKind] = useState<CashMovementKind>("EXPENSE");
  const [type, setType] = useState(cashMovementTypeOptions.EXPENSE[0]);
  const typeOptions = cashMovementTypeOptions[movementKind];
  const defaultPaymentMethod = paymentOptions.find((method) => method.category === "cash")?.code ?? paymentOptions[0]?.code;

  function changeMovementKind(value: CashMovementKind) {
    setMovementKind(value);
    setType(cashMovementTypeOptions[value][0]);
  }

  return (
    <>
      <Field label="Tipo de movimiento">
        <Select name="movementKind" value={movementKind} onChange={(event) => changeMovementKind(event.target.value as CashMovementKind)}>
          {cashMovementKinds.map((kind) => (
            <option key={kind} value={kind}>
              {cashMovementKindLabels[kind]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-zinc-300">
        {cashMovementKindDescriptions[movementKind]}
      </div>
      <Field label="Concepto">
        <Select name="type" value={type} onChange={(event) => setType(event.target.value)}>
          {typeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Monto">
        <Input name="amount" type="number" defaultValue="25" min="0" step="0.01" />
      </Field>
      <Field label="Metodo de pago">
        <Select name="paymentMethod" defaultValue={defaultPaymentMethod}>
          {paymentOptions.map((method) => (
            <option key={method.code} value={method.code}>
              {method.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Fecha">
        <Input name="date" type="date" defaultValue={defaultDate} />
      </Field>
      <Field label="Comentario">
        <Textarea name="comment" defaultValue="Movimiento operativo de caja" />
      </Field>
    </>
  );
}
