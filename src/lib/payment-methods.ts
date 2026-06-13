export type PaymentMethodCategory = "cash" | "bank" | "wallet" | "card" | "credit" | "mixed" | "other";

export type CountryPaymentMethod = {
  code: string;
  label: string;
  category: PaymentMethodCategory;
  description?: string;
};

const paymentMethodsByCountry: Record<string, CountryPaymentMethod[]> = {
  VE: [
    { code: "CASH_USD", label: "Efectivo $", category: "cash", description: "Pago recibido en dólares en efectivo." },
    { code: "CASH_LOCAL", label: "Efectivo Bs", category: "cash", description: "Pago recibido en bolívares en efectivo." },
    { code: "PAGO_MOVIL", label: "Pago móvil", category: "wallet", description: "Pago móvil interbancario venezolano." },
    { code: "BANK_TRANSFER", label: "Transferencia bancaria", category: "bank" },
    { code: "CARD", label: "Punto de venta", category: "card" },
    { code: "CREDIT", label: "Crédito", category: "credit" },
    { code: "MIXED", label: "Mixto", category: "mixed" }
  ],
  CO: [
    { code: "CASH_LOCAL", label: "Efectivo COP", category: "cash" },
    { code: "BANK_TRANSFER", label: "Transferencia bancaria", category: "bank" },
    { code: "PSE", label: "PSE", category: "bank" },
    { code: "NEQUI", label: "Nequi", category: "wallet" },
    { code: "DAVIPLATA", label: "Daviplata", category: "wallet" },
    { code: "CARD", label: "Tarjeta", category: "card" },
    { code: "CREDIT", label: "Crédito", category: "credit" }
  ],
  BR: [
    { code: "CASH_LOCAL", label: "Dinheiro BRL", category: "cash" },
    { code: "PIX", label: "Pix", category: "wallet" },
    { code: "BANK_TRANSFER", label: "Transferência bancária", category: "bank" },
    { code: "CARD", label: "Cartão", category: "card" },
    { code: "CREDIT", label: "Crédito", category: "credit" }
  ],
  MX: [
    { code: "CASH_LOCAL", label: "Efectivo MXN", category: "cash" },
    { code: "SPEI", label: "SPEI", category: "bank" },
    { code: "CARD", label: "Tarjeta", category: "card" },
    { code: "OXXO", label: "OXXO", category: "other" },
    { code: "CREDIT", label: "Crédito", category: "credit" }
  ],
  PA: [
    { code: "CASH_LOCAL", label: "Efectivo USD", category: "cash" },
    { code: "ACH", label: "ACH", category: "bank" },
    { code: "YAPPY", label: "Yappy", category: "wallet" },
    { code: "CARD", label: "Tarjeta", category: "card" },
    { code: "CREDIT", label: "Crédito", category: "credit" }
  ],
  PE: [
    { code: "CASH_LOCAL", label: "Efectivo PEN", category: "cash" },
    { code: "BANK_TRANSFER", label: "Transferencia bancaria", category: "bank" },
    { code: "YAPE", label: "Yape", category: "wallet" },
    { code: "PLIN", label: "Plin", category: "wallet" },
    { code: "CARD", label: "Tarjeta", category: "card" },
    { code: "CREDIT", label: "Crédito", category: "credit" }
  ],
  CL: [
    { code: "CASH_LOCAL", label: "Efectivo CLP", category: "cash" },
    { code: "BANK_TRANSFER", label: "Transferencia bancaria", category: "bank" },
    { code: "MERCADO_PAGO", label: "Mercado Pago", category: "wallet" },
    { code: "CARD", label: "Tarjeta", category: "card" },
    { code: "CREDIT", label: "Crédito", category: "credit" }
  ],
  DO: [
    { code: "CASH_LOCAL", label: "Efectivo DOP", category: "cash" },
    { code: "BANK_TRANSFER", label: "Transferencia bancaria", category: "bank" },
    { code: "CARD", label: "Tarjeta", category: "card" },
    { code: "CREDIT", label: "Crédito", category: "credit" }
  ],
  US: [
    { code: "CASH_LOCAL", label: "Cash USD", category: "cash" },
    { code: "ACH", label: "ACH", category: "bank" },
    { code: "CARD", label: "Card", category: "card" },
    { code: "CREDIT", label: "Credit", category: "credit" }
  ]
};

export function getPaymentMethodsForCountry(countryCode: string) {
  return paymentMethodsByCountry[countryCode] ?? paymentMethodsByCountry.VE;
}

export function getPaymentMethod(methodCode: string, countryCode = "VE") {
  return (
    getPaymentMethodsForCountry(countryCode).find((method) => method.code === methodCode) ??
    Object.values(paymentMethodsByCountry).flat().find((method) => method.code === methodCode)
  );
}

export function getPaymentMethodLabel(methodCode: string, countryCode = "VE") {
  return getPaymentMethod(methodCode, countryCode)?.label ?? methodCode;
}

export function getPaymentMethodCategory(methodCode: string, countryCode = "VE"): PaymentMethodCategory {
  return getPaymentMethod(methodCode, countryCode)?.category ?? "other";
}

export function getPaymentMethodCodes() {
  return Array.from(new Set(Object.values(paymentMethodsByCountry).flat().map((method) => method.code)));
}
