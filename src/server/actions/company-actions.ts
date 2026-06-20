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
      timeZone: countryConfig.timeZone,
      defaultInterestRate: parsed.data.defaultInterestRatePercent / 100,
      defaultTermDays: parsed.data.defaultTermDays,
      paymentFrequency: parsed.data.paymentFrequency,
      lateFeeRate: parsed.data.lateFeeRatePercent / 100,
      lateFeeGraceDays: parsed.data.lateFeeGraceDays,
      paymentAllocationOrder: parsed.data.paymentAllocationOrder,
      renewalPolicy: parsed.data.renewalPolicy,
      cashboxOpeningMode: parsed.data.cashboxOpeningMode,
      cashboxAutoOpenTime: parsed.data.cashboxOpeningMode === "SCHEDULED" ? parsed.data.cashboxAutoOpenTime || null : null
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
        currencyCode: previousCompany.currencyCode,
        defaultInterestRate: Number(previousCompany.defaultInterestRate),
        defaultTermDays: previousCompany.defaultTermDays,
        paymentFrequency: previousCompany.paymentFrequency,
        lateFeeRate: Number(previousCompany.lateFeeRate),
        lateFeeGraceDays: previousCompany.lateFeeGraceDays,
        paymentAllocationOrder: previousCompany.paymentAllocationOrder,
        renewalPolicy: previousCompany.renewalPolicy,
        cashboxOpeningMode: previousCompany.cashboxOpeningMode,
        cashboxAutoOpenTime: previousCompany.cashboxAutoOpenTime
      },
      newValue: {
        name: updatedCompany.name,
        rif: updatedCompany.rif,
        countryCode: updatedCompany.countryCode,
        currencyCode: updatedCompany.currencyCode,
        defaultInterestRate: Number(updatedCompany.defaultInterestRate),
        defaultTermDays: updatedCompany.defaultTermDays,
        paymentFrequency: updatedCompany.paymentFrequency,
        lateFeeRate: Number(updatedCompany.lateFeeRate),
        lateFeeGraceDays: updatedCompany.lateFeeGraceDays,
        paymentAllocationOrder: updatedCompany.paymentAllocationOrder,
        renewalPolicy: updatedCompany.renewalPolicy,
        cashboxOpeningMode: updatedCompany.cashboxOpeningMode,
        cashboxAutoOpenTime: updatedCompany.cashboxAutoOpenTime
      }
    }
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/loans");
  revalidatePath("/clients");
  revalidatePath("/cashbox");
  return { ok: true, message: "Empresa actualizada correctamente." };
}
