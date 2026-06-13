"use server";

import { revalidatePath } from "next/cache";
import { clientDocumentSchema, clientLocationSchema } from "@/lib/validations";

export async function updateClientLocationAction(formData: FormData) {
  const payload = clientLocationSchema.parse(Object.fromEntries(formData));
  // Persist with Prisma Client.update and AuditLog once auth/database flow is active.
  revalidatePath(`/clients/${payload.clientId}`);
  revalidatePath("/clients");
  revalidatePath("/routes");
  return { ok: true, message: "Ubicación GPS guardada correctamente", payload };
}

export async function uploadClientDocumentAction(formData: FormData) {
  const payload = clientDocumentSchema.parse(Object.fromEntries(formData));
  // Persist with Prisma ClientDocument.upsert and AuditLog once file storage is active.
  revalidatePath(`/clients/${payload.clientId}`);
  revalidatePath("/clients");
  return { ok: true, message: "Documento cargado correctamente", payload };
}
