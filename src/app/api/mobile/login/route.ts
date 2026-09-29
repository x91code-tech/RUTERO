import { NextResponse } from "next/server";
import { authenticate, authenticateMobile } from "@/lib/auth-login";
import { createSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

async function parseBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    const formData = new FormData();
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") formData.set(key, value);
    }
    return formData;
  }
  return request.formData();
}

export async function POST(request: Request) {
  const formData = await parseBody(request);
  const mode = formData.get("mode");
  const result = mode === "pin" ? await authenticateMobile(formData) : await authenticate(formData);

  if ("ok" in result) {
    return NextResponse.json({ ok: false, message: result.message, fieldErrors: result.fieldErrors ?? null }, { status: 400 });
  }

  const session = await createSessionToken(result.userId);
  return NextResponse.json({
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    redirectTo: result.redirectTo
  });
}
