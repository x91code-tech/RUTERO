import { z } from "zod";
import { getPaymentMethodCodes } from "@/lib/payment-methods";

const newPasswordSchema = z.string()
  .min(8, "La contrasena debe tener minimo 8 caracteres")
  .regex(/[A-Za-z]/, "La contrasena debe incluir letras")
  .regex(/\d/, "La contrasena debe incluir numeros");

export const moneySchema = z.coerce.number().positive("El monto debe ser mayor a cero");
const paymentMethodSchema = z.string().refine((value) => getPaymentMethodCodes().includes(value), "Metodo de pago invalido");
const formBooleanSchema = z.union([z.boolean(), z.string()]).transform((value) => value === true || value === "true" || value === "1" || value === "on");
const optionalLatitudeSchema = z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.number().min(-90).max(90).optional());
const optionalLongitudeSchema = z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.number().min(-180).max(180).optional());

export const saleSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  product: z.string().min(2, "Indica el producto o concepto"),
  amount: moneySchema,
  paymentMethod: paymentMethodSchema,
  date: z.string().optional(),
  observation: z.string().optional()
});

export const collectionSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  loanId: z.string().optional(),
  amount: moneySchema,
  paymentType: z.enum(["INSTALLMENT", "ADVANCE", "SETTLEMENT", "MANUAL", "RENEWAL", "ADDITIONAL"]).default("INSTALLMENT"),
  application: z.enum(["NORMAL", "CAPITAL_INTEREST", "CAPITAL_ONLY", "INTEREST_ONLY", "LATE_FEE", "ADDITIONAL_WITH_BALANCE", "ADDITIONAL_NO_BALANCE"]).default("NORMAL"),
  paymentMethod: paymentMethodSchema,
  date: z.string().optional(),
  observation: z.string().optional()
});

export const loanSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  principalAmount: moneySchema,
  interestRatePercent: z.coerce.number().min(0, "El interes no puede ser negativo").max(100, "El interes maximo permitido es 100").default(20),
  paymentFrequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).default("DAILY"),
  termDays: z.coerce.number().int().min(1, "Debe ser al menos 1 dia").max(365, "El plazo maximo es 365 dias"),
  startDate: z.string().optional(),
  notes: z.string().optional()
});

export const renewalLoanSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  loanId: z.string().min(1, "Selecciona el prestamo a renovar"),
  principalAmount: moneySchema,
  interestRatePercent: z.coerce.number().min(0, "El interes no puede ser negativo").max(100, "El interes maximo permitido es 100").default(20),
  paymentFrequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]).default("DAILY"),
  termDays: z.coerce.number().int().min(1, "Debe ser al menos 1 dia").max(365, "El plazo maximo es 365 dias"),
  startDate: z.string().optional(),
  notes: z.string().optional()
});

export const expenseSchema = z.object({
  movementKind: z.enum(["EXPENSE", "WITHDRAWAL", "INCOME"]).default("EXPENSE"),
  type: z.string().min(2, "Selecciona el tipo de gasto"),
  amount: moneySchema,
  paymentMethod: paymentMethodSchema,
  date: z.string().optional(),
  comment: z.string().min(2, "Agrega un comentario")
});

export const cashboxCloseSchema = z.object({
  reportedCash: z.coerce.number(),
  reportedTransfer: z.coerce.number().nonnegative(),
  reportedPix: z.coerce.number().nonnegative(),
  observations: z.string().optional()
});

export const clientLocationSchema = z.object({
  clientId: z.string().min(1, "Cliente requerido"),
  type: z.enum(["STORE", "WAREHOUSE", "BILLING", "OTHER"]).default("STORE"),
  label: z.string().min(2, "Indica una etiqueta"),
  address: z.string().min(2, "Indica la direccion"),
  latitude: z.coerce.number().min(-90, "Latitud invalida").max(90, "Latitud invalida"),
  longitude: z.coerce.number().min(-180, "Longitud invalida").max(180, "Longitud invalida"),
  isPrimary: formBooleanSchema.default(false)
});

export const clientDocumentSchema = z.object({
  clientId: z.string().min(1, "Cliente requerido"),
  countryCode: z.string().min(2, "Pais requerido"),
  documentType: z.string().min(2, "Tipo de documento requerido"),
  label: z.string().min(2, "Etiqueta requerida"),
  required: formBooleanSchema.default(false),
  fileUrl: z.string().url("Archivo invalido").optional(),
  notes: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo valido").transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8, "La contrasena debe tener minimo 8 caracteres")
});

export const mobileLoginSchema = z.object({
  identifier: z.string().min(4, "Indica tu identificador").transform((value) => value.trim().toUpperCase().replace(/\s+/g, "")),
  pin: z.string().regex(/^\d{4}$/, "El PIN debe tener 4 numeros")
});

export const registerCompanySchema = z.object({
  companyName: z.string().min(2, "Indica el nombre de la empresa"),
  rif: z.string().optional(),
  countryCode: z.string().min(2, "Selecciona el pais"),
  currencyCode: z.string().min(3, "Selecciona la moneda"),
  adminName: z.string().min(2, "Indica el nombre del administrador"),
  email: z.string().email("Ingresa un correo valido").transform((value) => value.toLowerCase().trim()),
  password: newPasswordSchema
});

export const createClientSchema = z.object({
  name: z.string().min(2, "Indica el nombre del cliente"),
  phone: z.string().min(7, "Indica un telefono valido"),
  address: z.string().min(4, "Indica la direccion principal"),
  document: z.string().min(4, "Indica cedula, RIF o documento"),
  routeId: z.string().optional(),
  sellerId: z.string().optional(),
  notes: z.string().optional(),
  storeLatitude: optionalLatitudeSchema,
  storeLongitude: optionalLongitudeSchema,
  secondaryAddress: z.string().optional(),
  secondaryLatitude: optionalLatitudeSchema,
  secondaryLongitude: optionalLongitudeSchema
});

export const createUserSchema = z.object({
  name: z.string().min(2, "Indica el nombre"),
  email: z.string().email("Ingresa un correo valido").transform((value) => value.toLowerCase().trim()),
  role: z.enum(["ADMIN", "SUPERVISOR", "SELLER"]),
  password: newPasswordSchema
});

export const companySettingsSchema = z.object({
  name: z.string().min(2, "Indica el nombre de la empresa"),
  rif: z.string().optional(),
  countryCode: z.string().min(2, "Selecciona el pais"),
  defaultInterestRatePercent: z.coerce.number().min(0, "El interes no puede ser negativo").max(100, "El interes maximo permitido es 100"),
  defaultTermDays: z.coerce.number().int().min(1, "Debe ser al menos 1 dia").max(365, "El plazo maximo es 365 dias"),
  paymentFrequency: z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]),
  lateFeeRatePercent: z.coerce.number().min(0, "La mora no puede ser negativa").max(100, "La mora maxima permitida es 100"),
  lateFeeGraceDays: z.coerce.number().int().min(0, "Los dias de gracia no pueden ser negativos").max(365, "Maximo 365 dias"),
  paymentAllocationOrder: z.enum(["LATE_FEE_INTEREST_PRINCIPAL", "INTEREST_PRINCIPAL_LATE_FEE", "PRINCIPAL_INTEREST_LATE_FEE"]),
  renewalPolicy: z.enum(["PAID_ONLY", "ADMIN_OVERRIDE", "ALLOW_BALANCE"]),
  cashboxOpeningMode: z.enum(["MANUAL", "SCHEDULED"]),
  cashboxAutoOpenTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa formato HH:MM").optional().or(z.literal(""))
});

export const createRouteSchema = z.object({
  name: z.string().min(2, "Indica el nombre de la ruta"),
  zone: z.string().min(2, "Indica la zona"),
  sellerId: z.string().optional()
});

export const verifyClientSchema = z.object({
  clientId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().optional()
});
