"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/permissions";
import { getSessionUser } from "@/lib/session";
import { createUserSchema } from "@/lib/validations";

export type UserFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createUserAction(formData: FormData) {
  const currentUser = await getSessionUser();
  if (!currentUser) redirect("/login");
  if (!canManageUsers(currentUser.role)) redirect("/settings?error=permission");

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

export async function createUserFormAction(_state: UserFormState, formData: FormData): Promise<UserFormState> {
  const currentUser = await getSessionUser();
  if (!currentUser) redirect("/login");
  if (!canManageUsers(currentUser.role)) return { ok: false, message: "No tienes permiso para crear usuarios." };

  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los datos del usuario.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) return { ok: false, message: "Ya existe un usuario con ese correo." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      companyId: currentUser.companyId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role
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
  return { ok: true, message: `${user.name} fue creado correctamente.` };
}
