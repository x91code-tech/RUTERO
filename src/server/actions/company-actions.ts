"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrencyConfig } from "@/lib/countries";
import { prisma } from "@/lib/db";
import { canManageCompany } from "@/lib/permissions";
import { getSessionUser } from "@/lib/session";
import { companySettingsSchema } from "@/lib/validations";

export type CompanyFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function updateCompanySettingsAction(_state: CompanyFormState, formData: FormData): Promise<CompanyFormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canManageCompany(user.role)) return { ok: false, message: "No tienes permiso para modificar la empresa." };

  const parsed = companySettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los datos de la empresa.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const countryConfig = getCurrencyConfig({ countryCode: parsed.data.countryCode });
  const previousCompany = await prisma.company.findUniqueOrThrow({ where: { id: user.companyId } });
  const updatedCompany = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      name: parsed.data.name,
      rif: parsed.data.rif || null,
      countryCode: countryConfig.countryCode,
      currencyCode: countryConfig.currencyCode,
      locale: countryConfig.locale,
      timeZone: countryConfig.timeZone
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      action: "COMPANY_SETTINGS_UPDATED",
      entity: "Company",
      entityId: user.companyId,
      oldValue: {
        name: previousCompany.name,
        rif: previousCompany.rif,
        countryCode: previousCompany.countryCode,
        currencyCode: previousCompany.currencyCode
      },
      newValue: {
        name: updatedCompany.name,
        rif: updatedCompany.rif,
        countryCode: updatedCompany.countryCode,
        currencyCode: updatedCompany.currencyCode
      }
    }
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true, message: "Empresa actualizada correctamente." };
}
