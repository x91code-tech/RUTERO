import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isCompanyBillingSuspended } from "@/lib/billing";

const sessionCookieName = "rutero_session";
const sessionDurationDays = 30;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSessionToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + sessionDurationDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  return { token, expiresAt };
}

export async function getUserFromSessionToken(token: string): Promise<User | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true }
  });

  if (
    !session ||
    session.expiresAt < new Date() ||
    !session.user.active ||
    (session.user.role !== "SUPER_ADMIN" && await isCompanyBillingSuspended(session.user.companyId)) ||
    (session.user.role === "PARTNER" && !await prisma.partnerProfile.findFirst({ where: { userId: session.user.id, active: true }, select: { id: true } }))
  ) {
    if (session) {
      await prisma.session.deleteMany({ where: { id: session.id } });
    }
    return null;
  }

  return session.user;
}

async function shouldUseSecureCookies() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;

  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  if (forwardedProto) return forwardedProto.split(",")[0]?.trim() === "https";

  const referer = headerStore.get("referer");
  if (referer) return referer.startsWith("https://");

  return false;
}

export async function createUserSession(userId: string) {
  const { token, expiresAt } = await createSessionToken(userId);

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await shouldUseSecureCookies(),
    path: "/",
    expires: expiresAt
  });
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const user = await getUserFromSessionToken(token);

  if (!user) {
    await clearUserSession();
    return null;
  }

  return user;
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(token) }
    });
  }

  cookieStore.delete(sessionCookieName);
}
