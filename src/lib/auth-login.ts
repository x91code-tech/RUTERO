import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { isCompanyBillingSuspended } from "@/lib/billing";
import { prisma } from "@/lib/db";
import { getDefaultPathForRole } from "@/lib/permissions";
import { loginSchema, mobileLoginSchema } from "@/lib/validations";

export type AuthFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function normalizeNextPath(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/register") || value.startsWith("/mobile-login")) return fallback;
  return value;
}

function getDeviceToken(formData: FormData) {
  const value = formData.get("deviceToken");
  if (typeof value !== "string") return null;
  const token = value.trim();
  if (token.length < 20 || token.length > 200) return null;
  return token;
}

function getDeviceName(formData: FormData) {
  const value = formData.get("deviceName");
  if (typeof value !== "string") return "Telefono vinculado";
  return value.trim().slice(0, 180) || "Telefono vinculado";
}

function generateIdentifier() {
  return `COB-${randomInt(100000, 1000000)}`;
}

function generatePin() {
  return randomInt(0, 10000).toString().padStart(4, "0");
}

async function generateUniqueIdentifier() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const mobileIdentifier = generateIdentifier();
    const existing = await prisma.user.findUnique({ where: { mobileIdentifier } });
    if (!existing) return mobileIdentifier;
  }
  throw new Error("No se pudo generar un identificador unico.");
}

async function verifyOrBindCollectorDevice(user: {
  id: string;
  role: string;
  mobileIdentifier: string | null;
  mobileDeviceHash: string | null;
}, formData: FormData) {
  if (user.role !== "SELLER") return { ok: true as const, linkedNow: false };

  const deviceToken = getDeviceToken(formData);
  if (!deviceToken) {
    return { ok: false as const, message: "No se pudo identificar este telefono. Abre la app nuevamente e intenta entrar." };
  }

  if (user.mobileDeviceHash) {
    const isSameDevice = await bcrypt.compare(deviceToken, user.mobileDeviceHash);
    if (!isSameDevice) {
      return { ok: false as const, message: "Este cobrador ya esta vinculado a otro telefono. Pide al administrador liberar el dispositivo." };
    }
    return { ok: true as const, linkedNow: false };
  }

  const mobileIdentifier = user.mobileIdentifier ?? (await generateUniqueIdentifier());
  await prisma.user.update({
    where: { id: user.id },
    data: {
      mobileIdentifier,
      mobileDeviceHash: await bcrypt.hash(deviceToken, 10),
      mobileDeviceName: getDeviceName(formData),
      mobileDeviceBoundAt: new Date()
    }
  });

  return { ok: true as const, linkedNow: true };
}

export async function authenticate(formData: FormData): Promise<AuthFormState | { userId: string; redirectTo: string }> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa el correo y la contrasena.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  const isValidPassword = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !isValidPassword) {
    return { ok: false, message: "Correo o contrasena incorrectos." };
  }

  if (!user.active) {
    return { ok: false, message: "Este usuario esta inactivo. Contacta al administrador de la empresa." };
  }

  if (user.role !== "SUPER_ADMIN" && await isCompanyBillingSuspended(user.companyId)) {
    return { ok: false, message: "La suscripcion de la cuenta esta vencida y termino el periodo de gracia. Contacta al propietario de RUTERO." };
  }

  if (user.role === "PARTNER" && !await prisma.partnerProfile.findFirst({ where: { userId: user.id, active: true }, select: { id: true } })) {
    return { ok: false, message: "La cuenta de socio esta inactiva. Contacta al propietario de RUTERO." };
  }

  if (user.role === "SELLER" && user.mobileDeviceHash) {
    return { ok: false, message: "Este cobrador ya tiene un telefono vinculado. Entra por Acceso cobrador con tu PIN." };
  }

  const deviceCheck = await verifyOrBindCollectorDevice(user, formData);
  if (!deviceCheck.ok) return { ok: false, message: deviceCheck.message };

  if (user.role === "SELLER") {
    const pin = generatePin();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mobilePinHash: await bcrypt.hash(pin, 10),
        mobilePinUpdatedAt: new Date()
      }
    });

    return {
      userId: user.id,
      redirectTo: `/device-setup?pin=${encodeURIComponent(pin)}`
    };
  }

  return {
    userId: user.id,
    redirectTo: normalizeNextPath(formData.get("next"), getDefaultPathForRole(user.role))
  };
}

export async function authenticateMobile(formData: FormData): Promise<AuthFormState | { userId: string; redirectTo: string }> {
  const parsed = mobileLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa tu identificador y PIN.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const user = await prisma.user.findUnique({
    where: { mobileIdentifier: parsed.data.identifier }
  });

  const isValidPin = user?.mobilePinHash ? await bcrypt.compare(parsed.data.pin, user.mobilePinHash) : false;
  if (!user || user.role !== "SELLER" || !isValidPin) {
    return { ok: false, message: "Identificador o PIN incorrecto." };
  }

  if (!user.active) {
    return { ok: false, message: "Este cobrador esta inactivo. Contacta al administrador." };
  }

  if (await isCompanyBillingSuspended(user.companyId)) {
    return { ok: false, message: "La suscripcion de la empresa esta vencida. Contacta al administrador." };
  }

  if (!user.mobileDeviceHash) {
    return { ok: false, message: "Este cobrador aun no ha vinculado un telefono. Primero debe iniciar una vez con correo y contrasena." };
  }

  const deviceToken = getDeviceToken(formData);
  if (!deviceToken) {
    return { ok: false, message: "No se pudo identificar este telefono. Abre la app nuevamente e intenta entrar." };
  }

  const isSameDevice = await bcrypt.compare(deviceToken, user.mobileDeviceHash);
  if (!isSameDevice) {
    return { ok: false, message: "Este usuario esta vinculado a otro telefono. Pide al administrador liberar el dispositivo." };
  }

  return {
    userId: user.id,
    redirectTo: normalizeNextPath(formData.get("next"), "/seller")
  };
}
