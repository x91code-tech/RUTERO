import type { CollectionApplication, CollectionPaymentType } from "@/lib/types";

export const collectionPaymentTypeLabels: Record<CollectionPaymentType, string> = {
  INSTALLMENT: "Cuota",
  ADVANCE: "Adelanto",
  SETTLEMENT: "Pago total",
  MANUAL: "Manual",
  RENEWAL: "Renovacion",
  ADDITIONAL: "Adicional"
};

export const collectionApplicationLabels: Record<CollectionApplication, string> = {
  NORMAL: "Normal",
  CAPITAL_INTEREST: "Interes + capital",
  CAPITAL_ONLY: "Capital",
  INTEREST_ONLY: "Interes",
  LATE_FEE: "Mora",
  ADDITIONAL_WITH_BALANCE: "Adicional descuenta saldo",
  ADDITIONAL_NO_BALANCE: "Adicional no descuenta saldo"
};

export function collectionPaymentTypeLabel(value?: CollectionPaymentType) {
  return value ? collectionPaymentTypeLabels[value] : collectionPaymentTypeLabels.INSTALLMENT;
}

export function collectionApplicationLabel(value?: CollectionApplication) {
  return value ? collectionApplicationLabels[value] : collectionApplicationLabels.NORMAL;
}
