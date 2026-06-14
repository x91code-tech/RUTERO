"use server";

import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { canManageUsers } from "@/lib/permissions";
import { roleLabel } from "@/lib/roles";
import { getSessionUser } from "@/lib/session";
import { createUserSchema } from "@/lib/validations";
import { createNotification } from "@/server/services/notification-service";

export type UserFormState = {
  ok: boolean;
  message: string;
  mobileIdentifier?: string;
  pin?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type PinFormState = {
  ok: boolean;
  message: string;
  mobileIdentifier?: string;
  pin?: string;
};

function generatePin() {
  return randomInt(0, 10000).toString().padStart(4, "0");
}

function generateIdentifier() {
  return `COB-${randomInt(100000, 1000000)}`;
}

async function generateUniqueIdentifier() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const mobileIdentifier = generateIdentifier();
    const existing = await prisma.user.findUnique({ where: { mobileIdentifier } });
    if (!existing) return mobileIdentifier;
  }
  throw new Error("No se pudo generar un identificador unico.");
}

async function buildCollectorMobileCredentials() {
  const pin = generatePin();
  return {
    mobileIdentifier: await generateUniqueIdentifier(),
    pin,
    mobilePinHash: await bcrypt.hash(pin, 10),
    mobilePinUpdatedAt: new Date()
  };
}

export async function createUserAction(formData: FormData) {
  const currentUser = await getSessionUser();
  if (!currentUser) redirect("/login");
  if (!canManageUsers(currentUser.role)) redirect("/settings?error=permission");

  const payload = createUserSchema.parse(Object.fromEntries(formData));
  const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existingUser) redirect("/settings?error=user_exists");

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const mobileCredentials = payload.role === "SELLER" ? await buildCollectorMobileCredentials() : null;
  const user = await prisma.user.create({
    data: {
      companyId: currentUser.companyId,
      name: payload.name,
      email: payload.email,
      passwordHash,
      mobileIdentifier: mobileCredentials?.mobileIdentifier,
      mobilePinHash: mobileCredentials?.mobilePinHash,
      mobilePinUpdatedAt: mobileCredentials?.mobilePinUpdatedAt,
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
      newValue: { name: user.name, email: user.email, role: user.role, mobileIdentifier: user.mobileIdentifier }
    }
  });

  await createNotification({
    companyId: currentUser.companyId,
    title: "Usuario creado",
    message: `${user.name} fue creado con rol ${roleLabel(user.role)}.`,
    severity: "info"
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
  const mobileCredentials = parsed.data.role === "SELLER" ? await buildCollectorMobileCredentials() : null;
  const user = await prisma.user.create({
    data: {
      companyId: currentUser.companyId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      mobileIdentifier: mobileCredentials?.mobileIdentifier,
      mobilePinHash: mobileCredentials?.mobilePinHash,
      mobilePinUpdatedAt: mobileCredentials?.mobilePinUpdatedAt,
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
      newValue: { name: user.name, email: user.email, role: user.role, mobileIdentifier: user.mobileIdentifier }
    }
  });

  await createNotification({
    companyId: currentUser.companyId,
    title: "Usuario creado",
    message: `${user.name} fue creado con rol ${roleLabel(user.role)}.`,
    severity: "info"
  });

  revalidatePath("/settings");
  if (mobileCredentials) {
    return {
      ok: true,
      message: `${user.name} fue creado como cobrador. Entrega estos datos al telefono: ID ${mobileCredentials.mobileIdentifier} / PIN ${mobileCredentials.pin}.`,
      mobileIdentifier: mobileCredentials.mobileIdentifier,
      pin: mobileCredentials.pin
    };
  }

  return { ok: true, message: `${user.name} fue creado correctamente como ${roleLabel(user.role)}.` };
}

export async function resetCollectorPinFormAction(_state: PinFormState, formData: FormData): Promise<PinFormState> {
  const currentUser = await getSessionUser();
  if (!currentUser) redirect("/login");
  if (!canManageUsers(currentUser.role)) return { ok: false, message: "No tienes permiso para regenerar PIN." };

  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return { ok: false, message: "Usuario invalido." };

  const target = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId: currentUser.companyId,
      role: "SELLER"
    }
  });

  if (!target) return { ok: false, message: "Solo puedes generar PIN a cobradores de tu empresa." };

  const pin = generatePin();
  const mobileIdentifier = target.mobileIdentifier ?? (await generateUniqueIdentifier());
  const mobilePinHash = await bcrypt.hash(pin, 10);

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      mobileIdentifier,
      mobilePinHash,
      mobilePinUpdatedAt: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId: currentUser.companyId,
      userId: currentUser.id,
      action: "COLLECTOR_PIN_RESET",
      entity: "User",
      entityId: updated.id,
      newValue: { mobileIdentifier: updated.mobileIdentifier }
    }
  });

  await createNotification({
    companyId: currentUser.companyId,
    title: "PIN de cobrador generado",
    message: `${updated.name} tiene un nuevo PIN de acceso movil.`,
    severity: "info"
  });

  revalidatePath("/settings");
  return {
    ok: true,
    message: `Nuevo acceso movil para ${updated.name}: ID ${mobileIdentifier} / PIN ${pin}.`,
    mobileIdentifier,
    pin
  };
}
