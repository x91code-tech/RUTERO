import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { getBillingStatus } from "@/lib/billing";

const defaultPlans = [
  { name: "Individual", type: "INDIVIDUAL" as const, maxUsers: 1, maxSellers: 0, maxCompanies: 0 },
  { name: "Empresas", type: "BUSINESS" as const, maxUsers: 10, maxSellers: 5, maxCompanies: 0 },
  { name: "Socios", type: "PARTNER" as const, maxUsers: 1, maxSellers: 0, maxCompanies: 5 }
];

export async function requirePlatformOwner() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");
  return user;
}

export async function ensurePlatformDefaults() {
  const [settings, planCount] = await Promise.all([
    prisma.platformSettings.findUnique({ where: { id: "default" }, select: { id: true } }),
    prisma.platformPlan.count({ where: { name: { in: defaultPlans.map((plan) => plan.name) } } })
  ]);
  if (settings && planCount === defaultPlans.length) return;
  await prisma.$transaction([
    prisma.platformSettings.upsert({
      where: { id: "default" },
      create: { id: "default", gracePeriodDays: 5 },
      update: {}
    }),
    ...defaultPlans.map((plan) => prisma.platformPlan.upsert({
      where: { name: plan.name },
      create: {
        ...plan,
        monthlyPrice: 0,
        currencyCode: "USD"
      },
      update: {}
    }))
  ]);
}

export async function getPlatformDashboardData() {
  await requirePlatformOwner();
  await ensurePlatformDefaults();
  const [settings, plans, companies, partners, groupedCommissions] = await Promise.all([
    prisma.platformSettings.findUniqueOrThrow({ where: { id: "default" } }),
    prisma.platformPlan.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] }),
    prisma.company.findMany({
      where: { accountType: "CUSTOMER" },
      include: {
        subscription: {
          include: {
            platformPlan: true,
            payments: { orderBy: { receivedAt: "desc" }, take: 3 }
          }
        },
        referredByPartner: { include: { user: { select: { name: true } } } },
        users: {
          where: { role: "ADMIN" },
          select: { name: true, email: true },
          orderBy: { createdAt: "asc" },
          take: 1
        },
        _count: { select: { users: true } }
      },
      orderBy: { name: "asc" }
    }),
    prisma.partnerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
            company: {
              select: {
                id: true,
                name: true,
                accountType: true,
                subscription: {
                  include: {
                    platformPlan: true,
                    payments: { orderBy: { receivedAt: "desc" as const }, take: 3 }
                  }
                }
              }
            }
          }
        },
        commissions: {
          where: { status: "PAID" },
          select: {
            amount: true,
            currencyCode: true,
            paidAt: true,
            payoutMethod: true,
            payoutNetwork: true,
            payoutReference: true
          },
          orderBy: { paidAt: "desc" },
          take: 5
        },
        _count: { select: { referredCompanies: true } },
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.partnerCommission.groupBy({
      by: ["partnerId", "currencyCode"],
      where: { status: "PENDING" },
      _sum: { amount: true }
    })
  ]);
  const partnerCommissions = new Map<string, { amount: number; currencyCode: string }[]>();
  for (const item of groupedCommissions) {
    const rows = partnerCommissions.get(item.partnerId) ?? [];
    rows.push({ amount: Number(item._sum.amount ?? 0), currencyCode: item.currencyCode });
    partnerCommissions.set(item.partnerId, rows);
  }
  const partnersWithCommissions = partners.map((partner) => ({
    ...partner,
    commissions: partnerCommissions.get(partner.id) ?? [],
    payouts: partner.commissions
  }));

  return {
    settings,
    plans,
    companies,
    partners: partnersWithCommissions,
    summary: {
      companies: companies.length,
      partners: partners.length,
      dueSoon: companies.filter((company) => company.subscription && ["DUE_SOON", "GRACE"].includes(
        getBillingStatus(company.subscription?.renewsAt ?? null, company.subscription?.active ?? false, settings.gracePeriodDays)
      )).length,
      suspended: companies.filter((company) => company.subscription && getBillingStatus(
        company.subscription?.renewsAt ?? null,
        company.subscription?.active ?? false,
        settings.gracePeriodDays
      ) === "SUSPENDED").length,
      needsSetup: companies.filter((company) => !company.subscription).length,
      partnerDueSoon: partnersWithCommissions.filter((partner) => partner.user.company.subscription && ["DUE_SOON", "GRACE"].includes(getBillingStatus(
        partner.user.company.subscription?.renewsAt ?? null,
        partner.user.company.subscription?.active ?? false,
        settings.gracePeriodDays
      ))).length,
      partnerSuspended: partnersWithCommissions.filter((partner) => partner.user.company.subscription && getBillingStatus(
        partner.user.company.subscription?.renewsAt ?? null,
        partner.user.company.subscription?.active ?? false,
        settings.gracePeriodDays
      ) === "SUSPENDED").length
    }
  };
}

export async function getPartnerDashboardData() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "PARTNER") redirect("/dashboard");
  const [profile, settings, groupedCommissions] = await Promise.all([
    prisma.partnerProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            company: {
              select: {
                name: true,
                subscription: {
                  include: {
                    platformPlan: true,
                    payments: { orderBy: { receivedAt: "desc" }, take: 3 }
                  }
                }
              }
            }
          }
        },
        referredCompanies: {
          where: { accountType: "CUSTOMER" },
          include: {
            subscription: { include: { platformPlan: true } }
          },
          orderBy: { name: "asc" }
        }
      }
    }),
    prisma.platformSettings.findUniqueOrThrow({ where: { id: "default" } }),
    prisma.partnerCommission.groupBy({
      by: ["currencyCode", "status"],
      where: { partner: { userId: user.id } },
      _sum: { amount: true }
    })
  ]);
  if (!profile || !profile.active) redirect("/login?error=partner");
  return {
    profile,
    settings,
    commissions: groupedCommissions.map((item) => ({
      currencyCode: item.currencyCode,
      status: item.status,
      amount: item._sum.amount ?? 0
    }))
  };
}
