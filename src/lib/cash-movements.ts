import type { CashMovementKind } from "@/lib/types";

export const cashMovementKinds = ["EXPENSE", "WITHDRAWAL", "INCOME"] as const;
export type CashMovementKindLabel = "Gasto" | "Retiro" | "Entrada";

export const cashMovementKindLabels: Record<CashMovementKind, CashMovementKindLabel> = {
  EXPENSE: "Gasto",
  WITHDRAWAL: "Retiro",
  INCOME: "Entrada"
};

export const cashMovementKindDescriptions: Record<CashMovementKind, string> = {
  EXPENSE: "Gasto operativo de ruta",
  WITHDRAWAL: "Salida de dinero de la caja",
  INCOME: "Entrada manual de dinero a la caja"
};

export const cashMovementTypeOptions: Record<CashMovementKind, string[]> = {
  EXPENSE: [
    "Azulejos",
    "Comision",
    "Sueldo ayudante",
    "Sueldo revisor",
    "Varios",
    "Oficina",
    "Transporte",
    "Mto. Moto",
    "Gasolina",
    "Ayudante",
    "Arriendo",
    "Seguro",
    "Medico",
    "Rep. Tarjetas",
    "Tramites",
    "Alimentacion",
    "Rec-Cel-Cob",
    "Papeleria",
    "Vales",
    "VendaMais",
    "Otro"
  ],
  WITHDRAWAL: [
    "Varios",
    "Retiro de caja",
    "Socios",
    "Para otros cobros",
    "Cadenas",
    "Intereses",
    "Compra moto",
    "Prestamos",
    "Robos",
    "Descuadre"
  ],
  INCOME: [
    "Pago complementario",
    "Inversion",
    "Otros",
    "Ingreso de caja",
    "Ajuste de caja",
    "Ajuste x sistema (pagos clientes)"
  ]
};

export function normalizeCashMovementKind(value?: string | null): CashMovementKind {
  return cashMovementKinds.includes(value as CashMovementKind) ? (value as CashMovementKind) : "EXPENSE";
}

export function getCashMovementSign(kind: CashMovementKind) {
  return kind === "INCOME" ? 1 : -1;
}

export function getCashMovementImpact(amount: number, kind: CashMovementKind) {
  return amount * getCashMovementSign(kind);
}

export function isCashMovementOutflow(kind: CashMovementKind) {
  return kind === "EXPENSE" || kind === "WITHDRAWAL";
}
