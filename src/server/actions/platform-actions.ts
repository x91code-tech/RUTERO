"use server";

import bcrypt from "bcryptjs";
import { Prisma, type PlatformPlanType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addBillingMonths } from "@/lib/billing";
import { getCurrencyConfig, supportedCountries } from "@/lib/countries";
import { prisma } from "@/lib/db";
import { requirePlatformOwner } from "@/lib/platform-data";
import { getSessionUser } from "@/lib/session";

const paymentMethods = new Set(["USDT", "CRYPTO", "LOCAL_CURRENCY"]);
const currencyPattern = /^[A-Z0-9]{2,10}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class PartnerCreationError extends Error {
  constructor(readonly code: "inactive" | "limit" | "not-found") {
    super(code);
  }
}

class MissingSubscriptionError extends Error {}
class SubscriptionSetupError extends Error {
  constructor(readonly code: "company-not-found" | "already-configured" | "plan-type" | "limit") {
    super(code);
  }
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validInitialCredentials(email: string, password: string) {
  return emailPattern.test(email) && password.length >= 10 && Buffer.byteLength(password, "utf8") <= 72;
}

function parseDueDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function nonNegativeDecimal(value: string, allowZero: boolean) {
  try {
    const amount = new Prisma.Decimal(value);
    if (!amount.isFinite() || (allowZero ? amount.lessThan(0) : !amount.greaterThan(0)) || amount.decimalPlaces() > 8) return null;
    return amount;
  } catch {
    return null;
  }
}

async function findPlan(formData: FormData, allowedTypes: PlatformPlanType[]) {
  const planId = formString(formData, "planId");
  if (!planId) return null;
  return prisma.platformPlan.findFirst({
    where: { id: planId, active: true, type: { in: allowedTypes } }
  });
}

async function createTenantInTransaction(tx: Prisma.TransactionClient, {
  companyName,
  rif,
  countryCode,
  adminName,
  email,
  password,
  plan,
  accountType,
  partnerId,
  partnerCommissionRate,
  role
}: {
  companyName: string;
  rif: string;
  countryCode: string;
  adminName: string;
  email: string;
  password: string;
  plan: NonNullable<Awaited<ReturnType<typeof findPlan>>>;
  accountType: "CUSTOMER" | "PARTNER";
  partnerId?: string;
  partnerCommissionRate?: number;
  role: "ADMIN" | "PARTNER";
}) {
  const country = getCurrencyConfig({ countryCode });
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const renewsAt = addBillingMonths(now, 1);

  const company = await tx.company.create({
      data: {
        name: companyName,
        rif: rif || null,
        accountType,
        referredByPartnerId: partnerId,
        countryCode: country.countryCode,
        currencyCode: country.currencyCode,
        locale: country.locale,
        timeZone: country.timeZone,
        subscription: {
          create: {
            platformPlanId: plan.id,
            name: plan.name,
            planType: plan.type,
            billingAmount: plan.monthlyPrice,
            billingCurrency: plan.currencyCode,
            maxUsers: plan.maxUsers,
            maxSellers: plan.maxSellers,
            renewsAt
          }
        }
      }
  });
  const user = await tx.user.create({
      data: {
        companyId: company.id,
        name: adminName,
        email,
        passwordHash,
        role,
        countryCode: country.countryCode
      }
  });
  if (role === "PARTNER") {
    await tx.partnerProfile.create({
        data: {
          userId: user.id,
          maxCompanies: plan.maxCompanies,
          commissionRate: partnerCommissionRate ?? 0
        }
    });
  }
  await tx.auditLog.create({
      data: {
        companyId: company.id,
        userId: user.id,
        action: "PLATFORM_TENANT_CREATED",
        entity: "Company",
        entityId: company.id,
        newValue: { companyName: company.name, accountType, plan: plan.name, adminEmail: user.email }
      }
  });
  return { company, user };
}

async function createTenant(input: Parameters<typeof createTenantInTransaction>[1]) {
  return prisma.$transaction((tx) => createTenantInTransaction(tx, input));
}

export async function createPlatformCompanyAction(formData: FormData): Promise<never> {
  await requirePlatformOwner();
  const companyName = formString(formData, "companyName");
  const adminName = formString(formData, "adminName");
  const email = formString(formData, "email").toLowerCase();
  const password = formString(formData, "password");
  const countryCode = formString(formData, "countryCode");
  const rif = formString(formData, "rif");
  const partnerId = formString(formData, "partnerId") || undefined;
  const plan = await findPlan(formData, ["INDIVIDUAL", "BUSINESS"]);

  if (
    !companyName ||
    companyName.length > 120 ||
    !adminName ||
    adminName.length > 120 ||
    !validInitialCredentials(email, password) ||
    !supportedCountries.some((country) => country.countryCode === countryCode) ||
    !plan
  ) {
    redirect("/platform?error=invalid-company");
  }
  if (!plan.monthlyPrice.greaterThan(0)) redirect("/platform/plans?error=price");
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) redirect("/platform?error=email");
  const tenantInput = { companyName, rif, countryCode, adminName, email, password, plan, accountType: "CUSTOMER" as const, partnerId, role: "ADMIN" as const };
  if (partnerId) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${partnerId}, 0))`;
        const profile = await tx.partnerProfile.findUnique({ where: { id: partnerId } });
        if (!profile) throw new PartnerCreationError("not-found");
        if (!profile.active) throw new PartnerCreationError("inactive");
        const companyCount = await tx.company.count({ where: { referredByPartnerId: partnerId, accountType: "CUSTOMER" } });
        if (companyCount >= profile.maxCompanies) throw new PartnerCreationError("limit");
        await createTenantInTransaction(tx, tenantInput);
      });
    } catch (error) {
      if (error instanceof PartnerCreationError && error.code === "inactive") redirect("/platform?error=partner");
      if (error instanceof PartnerCreationError && error.code === "limit") redirect("/platform?error=partner-limit");
      if (error instanceof PartnerCreationError && error.code === "not-found") redirect("/platform?error=partner");
      throw error;
    }
  } else {
    await createTenant(tenantInput);
  }
  revalidatePath("/platform");
  redirect("/platform?created=company");
}

export async function createCompanySubscriptionAction(formData: FormData): Promise<never> {
  await requirePlatformOwner();
  const companyId = formString(formData, "companyId");
  const planId = formString(formData, "planId");
  const billingAmount = nonNegativeDecimal(formString(formData, "billingAmount"), false);
  const billingCurrency = formString(formData, "billingCurrency").toUpperCase();
  const renewsAtInput = formString(formData, "renewsAt");
  const renewsAt = parseDueDate(renewsAtInput);
  if (!companyId || !planId || !billingAmount || !currencyPattern.test(billingCurrency) || !renewsAt) {
    redirect("/platform?error=invalid-contract");
  }

  const plan = await prisma.platformPlan.findFirst({ where: { id: planId, active: true } });
  if (!plan || !plan.monthlyPrice.greaterThan(0)) redirect("/platform/plans?error=price");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${companyId}, 0))`;
      const company = await tx.company.findUnique({ where: { id: companyId }, select: { id: true, accountType: true } });
      if (!company) throw new SubscriptionSetupError("company-not-found");
      if (await tx.subscriptionPlan.findUnique({ where: { companyId }, select: { id: true } })) {
        throw new SubscriptionSetupError("already-configured");
      }
      if ((company.accountType === "PARTNER") !== (plan.type === "PARTNER")) {
        throw new SubscriptionSetupError("plan-type");
      }
      const [userCount, sellerCount] = await Promise.all([
        tx.user.count({ where: { companyId, active: true } }),
        tx.user.count({ where: { companyId, role: "SELLER", active: true } })
      ]);
      if (userCount > plan.maxUsers || sellerCount > plan.maxSellers) throw new SubscriptionSetupError("limit");
      await tx.subscriptionPlan.create({
        data: {
          companyId,
          platformPlanId: plan.id,
          name: plan.name,
          planType: plan.type,
          billingAmount,
          billingCurrency,
          maxUsers: plan.maxUsers,
          maxSellers: plan.maxSellers,
          renewsAt
        }
      });
    });
  } catch (error) {
    if (error instanceof SubscriptionSetupError) {
      const errors = {
        "company-not-found": "company",
        "already-configured": "subscription-exists",
        "plan-type": "invalid-contract",
        limit: "contract-below-usage"
      } as const;
      redirect(`/platform?error=${errors[error.code]}`);
    }
    throw error;
  }
  revalidatePath("/platform");
  redirect("/platform?created=subscription");
}

export async function createPlatformPartnerAction(formData: FormData): Promise<never> {
  await requirePlatformOwner();
  const companyName = formString(formData, "companyName");
  const adminName = formString(formData, "adminName");
  const email = formString(formData, "email").toLowerCase();
  const password = formString(formData, "password");
  const countryCode = formString(formData, "countryCode");
  const commissionRate = Number(formString(formData, "commissionRate"));
  const plan = await findPlan(formData, ["PARTNER"]);

  if (
    !companyName ||
    companyName.length > 120 ||
    !adminName ||
    adminName.length > 120 ||
    !validInitialCredentials(email, password) ||
    !supportedCountries.some((country) => country.countryCode === countryCode) ||
    !plan ||
    !Number.isFinite(commissionRate) ||
    commissionRate <= 0 ||
    commissionRate > 100
  ) {
    redirect("/platform/partners?error=invalid");
  }
  if (!plan.monthlyPrice.greaterThan(0)) redirect("/platform/plans?error=price");
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) redirect("/platform/partners?error=email");

  await createTenant({
    companyName,
    rif: "",
    countryCode,
    adminName,
    email,
    password,
    plan,
    accountType: "PARTNER",
    partnerCommissionRate: commissionRate / 100,
    role: "PARTNER"
  });
  revalidatePath("/platform/partners");
  redirect("/platform/partners?created=partner");
}

export async function createReferredCompanyAction(formData: FormData): Promise<never> {
  const partnerUser = await getSessionUser();
  if (!partnerUser) redirect("/login");
  if (partnerUser.role !== "PARTNER") redirect("/dashboard");
  const profile = await prisma.partnerProfile.findUnique({
    where: { userId: partnerUser.id },
    include: { _count: { select: { referredCompanies: true } } }
  });
  if (!profile?.active) redirect("/partner?error=inactive");
  if (profile._count.referredCompanies >= profile.maxCompanies) redirect("/partner?error=limit");

  const companyName = formString(formData, "companyName");
  const adminName = formString(formData, "adminName");
  const email = formString(formData, "email").toLowerCase();
  const password = formString(formData, "password");
  const countryCode = formString(formData, "countryCode");
  const rif = formString(formData, "rif");
  const plan = await findPlan(formData, ["INDIVIDUAL", "BUSINESS"]);
  if (
    !companyName ||
    companyName.length > 120 ||
    !adminName ||
    adminName.length > 120 ||
    !validInitialCredentials(email, password) ||
    !supportedCountries.some((country) => country.countryCode === countryCode) ||
    !plan
  ) redirect("/partner?error=invalid");
  if (!plan.monthlyPrice.greaterThan(0)) redirect("/partner?error=plan");
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) redirect("/partner?error=email");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${profile.id}, 0))`;
      const currentProfile = await tx.partnerProfile.findUnique({ where: { id: profile.id } });
      if (!currentProfile) throw new PartnerCreationError("not-found");
      if (!currentProfile.active) throw new PartnerCreationError("inactive");
      const referredCount = await tx.company.count({ where: { referredByPartnerId: profile.id, accountType: "CUSTOMER" } });
      if (referredCount >= currentProfile.maxCompanies) throw new PartnerCreationError("limit");
      await createTenantInTransaction(tx, {
        companyName,
        rif,
        countryCode,
        adminName,
        email,
        password,
        plan,
        accountType: "CUSTOMER",
        partnerId: profile.id,
        role: "ADMIN"
      });
    });
  } catch (error) {
    if (error instanceof PartnerCreationError && error.code === "limit") redirect("/partner?error=limit");
    if (error instanceof PartnerCreationError && error.code === "inactive") redirect("/partner?error=inactive");
    if (error instanceof PartnerCreationError && error.code === "not-found") redirect("/partner?error=inactive");
    throw error;
  }
  revalidatePath("/partner");
  revalidatePath("/platform");
  redirect("/partner?created=company");
}

export async function recordSubscriptionPaymentAction(formData: FormData): Promise<never> {
  const owner = await requirePlatformOwner();
  const companyId = formString(formData, "companyId");
  const amount = nonNegativeDecimal(formString(formData, "amount"), false);
  const currencyCode = formString(formData, "currencyCode").toUpperCase();
  const paymentMethod = formString(formData, "paymentMethod");
  const network = formString(formData, "network");
  const transactionRef = formString(formData, "transactionRef");
  const periodMonths = Number(formString(formData, "periodMonths"));
  if (!companyId || !amount || !currencyPattern.test(currencyCode) || !paymentMethods.has(paymentMethod) || network.length > 60 || transactionRef.length < 3 || transactionRef.length > 160 || !Number.isInteger(periodMonths) || periodMonths < 1 || periodMonths > 12) {
    redirect("/platform?error=invalid-payment");
  }

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${companyId}, 0))`;
      const company = await tx.company.findUnique({
        where: { id: companyId },
        include: { subscription: true, referredByPartner: true }
      });
      if (!company?.subscription) throw new MissingSubscriptionError();
      const receivedAt = new Date();
      const currentDueDate = company.subscription.renewsAt;
      const renewalBase = currentDueDate && currentDueDate > receivedAt ? currentDueDate : receivedAt;
      const payment = await tx.platformPayment.create({
        data: {
          companyId,
          subscriptionId: company.subscription.id,
          recordedById: owner.id,
          amount,
          currencyCode,
          paymentMethod,
          network: network || null,
          transactionRef,
          periodMonths,
          receivedAt
        }
      });
      await tx.subscriptionPlan.update({
        where: { id: company.subscription.id },
        data: { renewsAt: addBillingMonths(renewalBase, periodMonths), active: true }
      });
      if (company.accountType === "CUSTOMER" && company.referredByPartner) {
        const commissionAmount = amount
          .mul(company.referredByPartner.commissionRate)
          .toDecimalPlaces(8, Prisma.Decimal.ROUND_HALF_UP);
        if (commissionAmount.greaterThan(0)) {
          await tx.partnerCommission.create({
            data: {
              partnerId: company.referredByPartner.id,
              paymentId: payment.id,
              companyId,
              amount: commissionAmount,
              currencyCode,
              commissionRate: company.referredByPartner.commissionRate
            }
          });
        }
      }
      return payment;
    });
  } catch (error) {
    if (error instanceof MissingSubscriptionError) redirect("/platform?error=subscription");
    const target = error instanceof Prisma.PrismaClientKnownRequestError ? error.meta?.target : null;
    const isDuplicateReference = Array.isArray(target)
      ? target.includes("transactionRef")
      : typeof target === "string" && target.includes("transactionRef");
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && isDuplicateReference) {
      redirect("/platform?error=duplicate-payment");
    }
    throw error;
  }
  revalidatePath("/platform");
  revalidatePath("/platform/partners");
  revalidatePath("/partner");
  redirect(`/platform?received=${encodeURIComponent(result.id)}`);
}

export async function updateCompanySubscriptionAction(formData: FormData): Promise<never> {
  await requirePlatformOwner();
  const companyId = formString(formData, "companyId");
  const planId = formString(formData, "planId");
  const billingAmount = nonNegativeDecimal(formString(formData, "billingAmount"), false);
  const billingCurrency = formString(formData, "billingCurrency").toUpperCase();
  const renewsAtInput = formString(formData, "renewsAt");
  const isActive = formData.get("active") === "true";
  const dueDate = parseDueDate(renewsAtInput);
  if (!companyId || !planId || !billingAmount || !currencyPattern.test(billingCurrency) || !dueDate) {
    redirect("/platform?error=invalid-contract");
  }
  const plan = await prisma.platformPlan.findFirst({
    where: { id: planId, active: true, type: { in: ["INDIVIDUAL", "BUSINESS", "PARTNER"] } }
  });
  if (!plan) redirect("/platform?error=invalid-contract");

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${companyId}, 0))`;
    const company = await tx.company.findFirst({
      where: { id: companyId },
      include: { subscription: true }
    });
    if (!company?.subscription) throw new Error("Company subscription missing");
    if (
      (company.accountType === "PARTNER" && plan.type !== "PARTNER") ||
      (company.accountType === "CUSTOMER" && plan.type === "PARTNER")
    ) {
      redirect("/platform?error=invalid-contract");
    }
    const [userCount, sellerCount] = await Promise.all([
      tx.user.count({ where: { companyId, active: true } }),
      tx.user.count({ where: { companyId, role: "SELLER", active: true } })
    ]);
    if (userCount > plan.maxUsers || sellerCount > plan.maxSellers) redirect("/platform?error=contract-below-usage");
    await tx.subscriptionPlan.update({
      where: { id: company.subscription.id },
      data: {
        platformPlanId: plan.id,
        name: plan.name,
        planType: plan.type,
        billingAmount,
        billingCurrency,
        maxUsers: plan.maxUsers,
        maxSellers: plan.maxSellers,
        renewsAt: dueDate,
        active: isActive
      }
    });
  });
  revalidatePath("/platform");
  redirect("/platform?saved=contract");
}

export async function updatePlatformPlanAction(formData: FormData): Promise<never> {
  await requirePlatformOwner();
  const id = formString(formData, "id");
  const monthlyPrice = nonNegativeDecimal(formString(formData, "monthlyPrice"), false);
  const currencyCode = formString(formData, "currencyCode").toUpperCase();
  const maxUsers = Number(formString(formData, "maxUsers"));
  const maxSellers = Number(formString(formData, "maxSellers"));
  const maxCompanies = Number(formString(formData, "maxCompanies"));
  if (!id || !monthlyPrice || !currencyPattern.test(currencyCode) || !Number.isInteger(maxUsers) || maxUsers < 1 || !Number.isInteger(maxSellers) || maxSellers < 0 || maxSellers > maxUsers || !Number.isInteger(maxCompanies) || maxCompanies < 0) {
    redirect("/platform/plans?error=invalid");
  }
  const existingPlan = await prisma.platformPlan.findUnique({ where: { id }, select: { type: true } });
  if (!existingPlan || (existingPlan.type === "PARTNER" && maxCompanies < 1)) redirect("/platform/plans?error=invalid");
  await prisma.platformPlan.update({
    where: { id },
    data: { monthlyPrice, currencyCode, maxUsers, maxSellers, maxCompanies }
  });
  revalidatePath("/platform");
  revalidatePath("/platform/plans");
  redirect("/platform/plans?saved=1");
}

export async function updateGracePeriodAction(formData: FormData): Promise<never> {
  await requirePlatformOwner();
  const gracePeriodDays = Number(formString(formData, "gracePeriodDays"));
  if (!Number.isInteger(gracePeriodDays) || gracePeriodDays < 0 || gracePeriodDays > 30) redirect("/platform?error=grace");
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", gracePeriodDays },
    update: { gracePeriodDays }
  });
  revalidatePath("/platform");
  redirect("/platform?saved=grace");
}

export async function updatePartnerTermsAction(formData: FormData): Promise<never> {
  await requirePlatformOwner();
  const partnerId = formString(formData, "partnerId");
  const commissionRate = Number(formString(formData, "commissionRate"));
  const maxCompanies = Number(formString(formData, "maxCompanies"));
  if (!partnerId || !Number.isFinite(commissionRate) || commissionRate <= 0 || commissionRate > 100 || !Number.isInteger(maxCompanies) || maxCompanies < 1) {
    redirect("/platform/partners?error=invalid-terms");
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${partnerId}, 0))`;
      const profile = await tx.partnerProfile.findUnique({ where: { id: partnerId } });
      if (!profile) throw new PartnerCreationError("not-found");
      const referredCount = await tx.company.count({ where: { referredByPartnerId: partnerId, accountType: "CUSTOMER" } });
      if (maxCompanies < referredCount) throw new PartnerCreationError("limit");
      await tx.partnerProfile.update({
        where: { id: partnerId },
        data: { commissionRate: commissionRate / 100, maxCompanies }
      });
    });
  } catch (error) {
    if (error instanceof PartnerCreationError && error.code === "limit") redirect("/platform/partners?error=limit-reduction");
    if (error instanceof PartnerCreationError && error.code === "not-found") redirect("/platform/partners?error=partner");
    throw error;
  }
  revalidatePath("/platform/partners");
  revalidatePath("/partner");
  redirect("/platform/partners?saved=terms");
}

export async function updatePartnerStatusAction(formData: FormData): Promise<never> {
  await requirePlatformOwner();
  const partnerId = formString(formData, "partnerId");
  const active = formData.get("active") === "true";
  if (!partnerId) redirect("/platform/partners?error=partner");
  const profile = await prisma.partnerProfile.findUnique({ where: { id: partnerId }, select: { userId: true } });
  if (!profile) redirect("/platform/partners?error=partner");
  await prisma.$transaction([
    prisma.partnerProfile.update({ where: { id: partnerId }, data: { active } }),
    prisma.user.update({ where: { id: profile.userId }, data: { active } })
  ]);
  revalidatePath("/platform/partners");
  revalidatePath("/partner");
  redirect("/platform/partners?saved=status");
}

export async function payPartnerCommissionsAction(formData: FormData): Promise<never> {
  const owner = await requirePlatformOwner();
  const partnerId = formString(formData, "partnerId");
  const currencyCode = formString(formData, "currencyCode").toUpperCase();
  const payoutReference = formString(formData, "payoutReference");
  const payoutMethod = formString(formData, "payoutMethod");
  const payoutNetwork = formString(formData, "payoutNetwork");
  if (!partnerId || !currencyPattern.test(currencyCode) || !paymentMethods.has(payoutMethod) || payoutNetwork.length > 60 || payoutReference.length < 3 || payoutReference.length > 160) {
    redirect("/platform/partners?error=invalid-payout");
  }
  const paid = await prisma.partnerCommission.updateMany({
    where: { partnerId, currencyCode, status: "PENDING" },
    data: {
      status: "PAID",
      paidAt: new Date(),
      payoutMethod,
      payoutNetwork: payoutNetwork || null,
      payoutReference,
      payoutRecordedById: owner.id
    }
  });
  if (!paid.count) redirect("/platform/partners?error=no-commission");
  revalidatePath("/platform/partners");
  revalidatePath("/partner");
  redirect("/platform/partners?paid=1");
}
