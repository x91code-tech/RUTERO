import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mobileOk, requireMobileUser, serializeMobileUser } from "@/lib/mobile-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireMobileUser(request);
  if (user instanceof NextResponse) return user;

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: {
      id: true,
      name: true,
      countryCode: true,
      currencyCode: true,
      locale: true,
      timeZone: true,
      defaultInterestRate: true,
      defaultTermDays: true,
      paymentFrequency: true
    }
  });

  return mobileOk({
    user: serializeMobileUser(user),
    company: company ? {
      ...company,
      defaultInterestRate: Number(company.defaultInterestRate)
    } : null
  });
}
