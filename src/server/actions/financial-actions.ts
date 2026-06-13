"use server";

import { revalidatePath } from "next/cache";
import { saleSchema, collectionSchema, expenseSchema, cashboxCloseSchema } from "@/lib/validations";

export async function createSaleAction(formData: FormData) {
  const payload = saleSchema.parse(Object.fromEntries(formData));
  // Persist with Prisma and write AuditLog in production flow.
  revalidatePath("/sales");
  return { ok: true, message: "Venta registrada correctamente", payload };
}

export async function createCollectionAction(formData: FormData) {
  const payload = collectionSchema.parse(Object.fromEntries(formData));
  revalidatePath("/collections");
  return { ok: true, message: "Recaudo registrado correctamente", payload };
}

export async function createExpenseAction(formData: FormData) {
  const payload = expenseSchema.parse(Object.fromEntries(formData));
  revalidatePath("/expenses");
  return { ok: true, message: "Gasto registrado correctamente", payload };
}

export async function closeCashboxAction(formData: FormData) {
  const payload = cashboxCloseSchema.parse(Object.fromEntries(formData));
  revalidatePath("/cashbox");
  return { ok: true, message: "Caja cerrada correctamente", payload };
}
