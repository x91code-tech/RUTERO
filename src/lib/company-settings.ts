import type { CashboxOpeningMode, PaymentAllocationOrder, PaymentFrequency, RenewalPolicy } from "@/lib/types";

export const paymentFrequencyLabels: Record<PaymentFrequency, string> = {
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual"
};

export const paymentAllocationOrderLabels: Record<PaymentAllocationOrder, string> = {
  LATE_FEE_INTEREST_PRINCIPAL: "Mora, interes y capital",
  INTEREST_PRINCIPAL_LATE_FEE: "Interes, capital y mora",
  PRINCIPAL_INTEREST_LATE_FEE: "Capital, interes y mora"
};

export const renewalPolicyLabels: Record<RenewalPolicy, string> = {
  PAID_ONLY: "Solo si pago todo",
  ADMIN_OVERRIDE: "Requiere autorizacion admin",
  ALLOW_BALANCE: "Permitir con saldo pendiente"
};

export const cashboxOpeningModeLabels: Record<CashboxOpeningMode, string> = {
  MANUAL: "Manual",
  SCHEDULED: "Programada"
};

export const paymentFrequencyOptions = Object.entries(paymentFrequencyLabels).map(([value, label]) => ({ value, label }));
export const paymentAllocationOrderOptions = Object.entries(paymentAllocationOrderLabels).map(([value, label]) => ({ value, label }));
export const renewalPolicyOptions = Object.entries(renewalPolicyLabels).map(([value, label]) => ({ value, label }));
export const cashboxOpeningModeOptions = Object.entries(cashboxOpeningModeLabels).map(([value, label]) => ({ value, label }));

export function getDefaultInterestPercent(defaultInterestRate?: number) {
  return Math.round(((defaultInterestRate ?? 0.2) * 100 + Number.EPSILON) * 100) / 100;
}

export function getDefaultTermDays(defaultTermDays?: number) {
  return defaultTermDays && defaultTermDays > 0 ? defaultTermDays : 20;
}
