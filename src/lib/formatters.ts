import { format } from "date-fns";
import { es } from "date-fns/locale";
import { defaultCurrencyConfig, getCurrencyConfig, type CurrencyConfig } from "@/lib/countries";

export function formatCurrency(value: number, config?: Partial<CurrencyConfig> | string) {
  const currencyConfig = typeof config === "string" ? getCurrencyConfig({ currencyCode: config }) : getCurrencyConfig(config ?? defaultCurrencyConfig);

  return new Intl.NumberFormat(currencyConfig.locale, {
    style: "currency",
    currency: currencyConfig.currencyCode,
    minimumFractionDigits: currencyConfig.fractionDigits,
    maximumFractionDigits: currencyConfig.fractionDigits
  }).format(value);
}

export function formatSpanishDate(date: string | Date) {
  return format(new Date(date), "EEEE dd 'de' MMMM yyyy", { locale: es });
}

export function formatShortDate(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
}

export function paymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    CASH: "Efectivo",
    TRANSFER: "Transferencia",
    PIX: "Pix",
    CREDIT: "Crédito",
    MIXED: "Mixto"
  };

  return labels[method] ?? method;
}
