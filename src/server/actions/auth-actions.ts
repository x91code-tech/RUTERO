"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { clearUserSession, createUserSession } from "@/lib/session";
import { getCurrencyConfig } from "@/lib/countries";
import { prisma } from "@/lib/db";
import { loginSchema, registerCompanySchema } from "@/lib/validations";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/login?error=invalid");

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  const isValidPassword = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !isValidPassword || !user.active) redirect("/login?error=credentials");

  await createUserSession(user.id);
  redirect(user.role === "SELLER" ? "/seller" : "/dashboard");
}

export async function registerCompanyAction(formData: FormData) {
  const parsed = registerCompanySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/register?error=invalid");

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });
  if (existingUser) redirect("/register?error=email");

  const countryConfig = getCurrencyConfig({
    countryCode: parsed.data.countryCode,
    currencyCode: parsed.data.currencyCode
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
