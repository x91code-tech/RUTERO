import { z } from "zod";

export const moneySchema = z.coerce.number().positive("El monto debe ser mayor a cero");

export const saleSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  product: z.string().min(2, "Indica el producto o concepto"),
  amount: moneySchema,
  paymentMethod: z.enum(["CASH", "TRANSFER", "PIX", "CREDIT", "MIXED"]),
  observation: z.string().optional()
});

export const collectionSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  amount: moneySchema,
  paymentMethod: z.enum(["CASH", "TRANSFER", "PIX", "CREDIT", "MIXED"]),
  observation: z.string().optional()
});

export const expenseSchema = z.object({
  type: z.enum(["Gasolina", "Comida", "Transporte", "Material", "Otro"]),
  amount: moneySchema,
  paymentMethod: z.enum(["CASH", "TRANSFER", "PIX", "CREDIT", "MIXED"]),
  comment: z.string().min(2, "Agrega un comentario")
});

export const cashboxCloseSchema = z.object({
  reportedCash: z.coerce.number().nonnegative(),
  reportedTransfer: z.coerce.number().nonnegative(),
  reportedPix: z.coerce.number().nonnegative(),
  observations: z.string().optional()
});

export const clientLocationSchema = z.object({
  clientId: z.string().min(1, "Cliente requerido"),
  type: z.enum(["STORE", "WAREHOUSE", "BILLING", "OTHER"]).default("STORE"),
  label: z.string().min(2, "Indica una etiqueta"),
  address: z.string().min(2, "Indica la dirección"),
  latitude: z.coerce.number().min(-90, "Latitud inválida").max(90, "Latitud inválida"),
  longitude: z.coerce.number().min(-180, "Longitud inválida").max(180, "Longitud inválida"),
  isPrimary: z.coerce.boolean().default(false)
});

export const clientDocumentSchema = z.object({
  clientId: z.string().min(1, "Cliente requerido"),
  countryCode: z.string().min(2, "País requerido"),
  documentType: z.string().min(2, "Tipo de documento requerido"),
  label: z.string().min(2, "Etiqueta requerida"),
  required: z.coerce.boolean().default(false),
  fileUrl: z.string().url("Archivo inválido").optional(),
  notes: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido").transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres")
});

export const registerCompanySchema = z.object({
  companyName: z.string().min(2, "Indica el nombre de la empresa"),
  rif: z.string().optional(),
  countryCode: z.string().min(2, "Selecciona el país"),
  currencyCode: z.string().min(3, "Selecciona la moneda"),
  adminName: z.string().min(2, "Indica el nombre del administrador"),
  email: z.string().email("Ingresa un correo válido").transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres")
});
