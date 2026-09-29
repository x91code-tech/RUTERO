import type { User } from "@prisma/client";
import { NextResponse } from "next/server";
import { getUserFromSessionToken } from "@/lib/session";

export function mobileError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export function mobileOk<T extends Record<string, unknown>>(data: T) {
  return NextResponse.json({ ok: true, ...data });
}

export async function requireMobileUser(request: Request): Promise<User | NextResponse> {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match?.[1]) return mobileError("Sesion requerida.", 401);

  const user = await getUserFromSessionToken(match[1].trim());
  if (!user) return mobileError("Sesion invalida o vencida.", 401);

  return user;
}

export function serializeMobileUser(user: User) {
  return {
    id: user.id,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    role: user.role,
    countryCode: user.countryCode,
    mobileIdentifier: user.mobileIdentifier
  };
}
