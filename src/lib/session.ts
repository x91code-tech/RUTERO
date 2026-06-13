import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";

const sessionCookieName = "rutero_session";
const sessionDurationDays = 30;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
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

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date() || !session.user.active) {
    await clearUserSession();
    return null;
  }

  return session.user;
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
