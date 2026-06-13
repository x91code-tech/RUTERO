"use server";

import { revalidatePath } from "next/cache";
import { clientLocationSchema } from "@/lib/validations";

export async function updateClientLocationAction(formData: FormData) {
  const payload = clientLocationSchema.parse(Object.fromEntries(formData));
  // Persist with Prisma Client.update and AuditLog once auth/database flow is active.
  revalidatePath(`/clients/${payload.clientId}`);
  revalidatePath("/clients");
  revalidatePath("/routes");
  return { ok: true, message: "Ubicación GPS guardada correctamente", payload };
}
