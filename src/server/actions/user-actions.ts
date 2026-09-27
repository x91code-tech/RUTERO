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

export type DeviceFormState = {
  ok: boolean;
  message: string;
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

type UserCapacityErrorCode = "inactive-subscription" | "user-limit" | "seller-limit";

class UserCapacityError extends Error {
  constructor(readonly code: UserCapacityErrorCode) {
    super(code);
  }
}

async function createUserWithinPlan({
  currentUser,
  payload,
  passwordHash,
  mobileCredentials,
  countryCode
}: {
  currentUser: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
  payload: { name: string; email: string; role: "ADMIN" | "SUPERVISOR" | "SELLER" };
  passwordHash: string;
  mobileCredentials: Awaited<ReturnType<typeof buildCollectorMobileCredentials>> | null;
  countryCode: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${currentUser.companyId}, 0))`;
    const subscription = await tx.subscriptionPlan.findUnique({ where: { companyId: currentUser.companyId } });
    if (!subscription?.active) throw new UserCapacityError("inactive-subscription");
    const [userCount, sellerCount] = await Promise.all([
      tx.user.count({ where: { companyId: currentUser.companyId } }),
      tx.user.count({ where: { companyId: currentUser.companyId, role: "SELLER" } })
    ]);
    if (userCount >= subscription.maxUsers) throw new UserCapacityError("user-limit");
    if (payload.role === "SELLER" && sellerCount >= subscription.maxSellers) throw new UserCapacityError("seller-limit");

    const user = await tx.user.create({
      data: {
        companyId: currentUser.companyId,
        name: payload.name,
        email: payload.email,
        passwordHash,
        mobileIdentifier: mobileCredentials?.mobileIdentifier,
        mobilePinHash: mobileCredentials?.mobilePinHash,
        mobilePinUpdatedAt: mobileCredentials?.mobilePinUpdatedAt,
        role: payload.role,
        countryCode: payload.role === "SELLER" ? countryCode : currentUser.countryCode
      }
    });
    await tx.auditLog.create({
      data: {
        companyId: currentUser.companyId,
        userId: currentUser.id,
        action: "USER_CREATED",
        entity: "User",
        entityId: user.id,
        newValue: { name: user.name, email: user.email, role: user.role, countryCode: user.countryCode, mobileIdentifier: user.mobileIdentifier }
      }
    });
    return user;
  });
}

function capacityErrorMessage(error: unknown) {
  if (!(error instanceof UserCapacityError)) return null;
  if (error.code === "inactive-subscription") return "La suscripción de la empresa está inactiva. Contacta al propietario de RUTERO.";
  if (error.code === "user-limit") return "La empresa alcanzó el máximo de usuarios de su plan.";
  return "La empresa alcanzó el máximo de cobradores de su plan.";
}

export async function createUserAction(formData: FormData) {
  const currentUser = await getSessionUser();
  if (!currentUser) redirect("/login");
  if (!canManageUsers(currentUser.role)) redirect("/settings?error=permission");

  const payload = createUserSchema.parse(Object.fromEntries(formData));
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: currentUser.companyId },
    select: { countryCode: true }
  });
  const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existingUser) redirect("/settings?error=user_exists");

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const mobileCredentials = payload.role === "SELLER" ? await buildCollectorMobileCredentials() : null;
  let user;
  try {
    user = await createUserWithinPlan({
      currentUser,
      payload,
      passwordHash,
      mobileCredentials,
      countryCode: payload.role === "SELLER" ? payload.countryCode : company.countryCode
    });
  } catch (error) {
    const message = capacityErrorMessage(error);
    if (message) redirect(`/settings?error=${encodeURIComponent(message)}`);
    throw error;
  }

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
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: currentUser.companyId },
    select: { countryCode: true }
  });

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) return { ok: false, message: "Ya existe un usuario con ese correo." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const mobileCredentials = parsed.data.role === "SELLER" ? await buildCollectorMobileCredentials() : null;
  let user;
  try {
    user = await createUserWithinPlan({
      currentUser,
      payload: parsed.data,
      passwordHash,
      mobileCredentials,
      countryCode: parsed.data.role === "SELLER" ? parsed.data.countryCode : company.countryCode
    });
  } catch (error) {
    const message = capacityErrorMessage(error);
    if (message) return { ok: false, message };
    throw error;
  }

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

export async function releaseCollectorDeviceFormAction(_state: DeviceFormState, formData: FormData): Promise<DeviceFormState> {
  const currentUser = await getSessionUser();
  if (!currentUser) redirect("/login");
  if (!canManageUsers(currentUser.role)) return { ok: false, message: "No tienes permiso para liberar telefonos." };

  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return { ok: false, message: "Usuario invalido." };

  const target = await prisma.user.findFirst({
    where: {
      id: userId,
      companyId: currentUser.companyId,
      role: "SELLER"
    }
  });

  if (!target) return { ok: false, message: "Solo puedes liberar cobradores de tu empresa." };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: {
        mobileDeviceHash: null,
        mobileDeviceName: null,
        mobileDeviceBoundAt: null
      }
    });

    await tx.session.deleteMany({
      where: { userId: target.id }
    });

    await tx.auditLog.create({
      data: {
        companyId: currentUser.companyId,
        userId: currentUser.id,
        action: "COLLECTOR_DEVICE_RELEASED",
        entity: "User",
        entityId: target.id,
        newValue: { mobileIdentifier: target.mobileIdentifier }
      }
    });
  });

  await createNotification({
    companyId: currentUser.companyId,
    title: "Telefono de cobrador liberado",
    message: `${target.name} puede vincular un telefono nuevo con correo y contrasena.`,
    severity: "warning"
  });

  revalidatePath("/settings");
  return { ok: true, message: `Telefono liberado para ${target.name}. Ahora puede iniciar con correo en el nuevo dispositivo.` };
}
