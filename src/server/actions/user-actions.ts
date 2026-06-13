"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { createUserSchema } from "@/lib/validations";

export async function createUserAction(formData: FormData) {
  const currentUser = await getSessionUser();
  if (!currentUser) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) redirect("/settings?error=permission");

  const payload = createUserSchema.parse(Object.fromEntries(formData));
  const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existingUser) redirect("/settings?error=user_exists");

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      companyId: currentUser.companyId,
      name: payload.name,
      email: payload.email,
      passwordHash,
      role: payload.role
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId: currentUser.companyId,
      userId: currentUser.id,
      action: "USER_CREATED",
      entity: "User",
      entityId: user.id,
      newValue: { name: user.name, email: user.email, role: user.role }
    }
  });

  revalidatePath("/settings");
}
