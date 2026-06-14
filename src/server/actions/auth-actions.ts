"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { clearUserSession, createUserSession } from "@/lib/session";
import { getCurrencyConfig } from "@/lib/countries";
import { prisma } from "@/lib/db";
import { loginSchema, mobileLoginSchema, registerCompanySchema } from "@/lib/validations";
import { getDefaultPathForRole } from "@/lib/permissions";

export type AuthFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function normalizeNextPath(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/register")) return fallback;
  return value;
}

async function authenticate(formData: FormData): Promise<AuthFormState | { userId: string; redirectTo: string }> {
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

  return {
    userId: user.id,
    redirectTo: normalizeNextPath(formData.get("next"), getDefaultPathForRole(user.role))
  };
}

async function authenticateMobile(formData: FormData): Promise<AuthFormState | { userId: string; redirectTo: string }> {
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

  return {
    userId: user.id,
    redirectTo: normalizeNextPath(formData.get("next"), "/seller")
  };
}

export async function loginAction(formData: FormData) {
  const result = await authenticate(formData);
  if ("ok" in result) redirect(`/login?error=${encodeURIComponent(result.message)}`);

  await createUserSession(result.userId);
  redirect(result.redirectTo);
}

export async function loginFormAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await authenticate(formData);
  if ("ok" in result) return result;

  await createUserSession(result.userId);
  redirect(result.redirectTo);
}

export async function mobileLoginFormAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await authenticateMobile(formData);
  if ("ok" in result) return result;

  await createUserSession(result.userId);
  redirect(result.redirectTo);
}

export async function registerCompanyAction(formData: FormData) {
  const parsed = registerCompanySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/register?error=invalid");

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });
  if (existingUser) redirect("/register?error=email");

  const countryConfig = getCurrencyConfig({
    countryCode: parsed.data.countryCode
  });
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: parsed.data.companyName,
        rif: parsed.data.rif || null,
        countryCode: countryConfig.countryCode,
        currencyCode: countryConfig.currencyCode,
        locale: countryConfig.locale,
        timeZone: countryConfig.timeZone,
        subscription: {
          create: {
            name: "PRO",
            maxUsers: 10,
            maxSellers: 5
          }
        }
      }
    });

    const admin = await tx.user.create({
      data: {
        companyId: company.id,
        name: parsed.data.adminName,
        email: parsed.data.email,
        passwordHash,
        role: "ADMIN"
      }
    });

    await tx.auditLog.create({
      data: {
        companyId: company.id,
        userId: admin.id,
        action: "COMPANY_REGISTERED",
        entity: "Company",
        entityId: company.id,
        newValue: {
          companyName: company.name,
          adminEmail: admin.email,
          countryCode: company.countryCode,
          currencyCode: company.currencyCode
        }
      }
    });

    return admin;
  });

  await createUserSession(user.id);
  redirect("/dashboard");
}

export async function registerCompanyFormAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerCompanySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los datos de la empresa y del administrador.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const [existingUser, existingCompany] = await Promise.all([
    prisma.user.findUnique({ where: { email: parsed.data.email } }),
    parsed.data.rif
      ? prisma.company.findFirst({
          where: {
            rif: parsed.data.rif
          }
        })
      : null
  ]);
  if (existingUser) return { ok: false, message: "Ese correo ya esta registrado." };
  if (existingCompany) return { ok: false, message: "Ya existe una empresa registrada con ese documento." };

  const countryConfig = getCurrencyConfig({
    countryCode: parsed.data.countryCode
  });
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: parsed.data.companyName,
        rif: parsed.data.rif || null,
        countryCode: countryConfig.countryCode,
        currencyCode: countryConfig.currencyCode,
        locale: countryConfig.locale,
        timeZone: countryConfig.timeZone,
        subscription: {
          create: {
            name: "PRO",
            maxUsers: 10,
            maxSellers: 5
          }
        }
      }
    });

    const admin = await tx.user.create({
      data: {
        companyId: company.id,
        name: parsed.data.adminName,
        email: parsed.data.email,
        passwordHash,
        role: "ADMIN"
      }
    });

    await tx.auditLog.create({
      data: {
        companyId: company.id,
        userId: admin.id,
        action: "COMPANY_REGISTERED",
        entity: "Company",
        entityId: company.id,
        newValue: {
          companyName: company.name,
          adminEmail: admin.email,
          countryCode: company.countryCode,
          currencyCode: company.currencyCode
        }
      }
    });

    return admin;
  });

  await createUserSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearUserSession();
  redirect("/login");
}
