import { prisma } from "@/lib/db";

export type BillingStatus = "CURRENT" | "DUE_SOON" | "GRACE" | "SUSPENDED" | "NO_DUE_DATE";

export function addBillingMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function getBillingStatus(renewsAt: Date | null, active: boolean, gracePeriodDays: number, now = new Date()): BillingStatus {
  if (!active) return "SUSPENDED";
  if (!renewsAt) return "NO_DUE_DATE";
  const graceEndsAt = new Date(renewsAt);
  graceEndsAt.setUTCDate(graceEndsAt.getUTCDate() + gracePeriodDays);
  if (now > graceEndsAt) return "SUSPENDED";
  if (now > renewsAt) return "GRACE";
  const daysRemaining = Math.ceil((renewsAt.getTime() - now.getTime()) / 86_400_000);
  return daysRemaining <= 7 ? "DUE_SOON" : "CURRENT";
}

export function formatBillingAmount(amount: number, currencyCode: string) {
  const formatted = new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(amount);
  return `${formatted} ${currencyCode}`;
}

export async function isCompanyBillingSuspended(companyId: string) {
  const [subscription, settings] = await Promise.all([
    prisma.subscriptionPlan.findUnique({ where: { companyId }, select: { active: true, renewsAt: true } }),
    prisma.platformSettings.findUnique({ where: { id: "default" }, select: { gracePeriodDays: true } })
  ]);
  if (!subscription) return false;
  return getBillingStatus(subscription.renewsAt, subscription.active, settings?.gracePeriodDays ?? 5) === "SUSPENDED";
}
