import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-login";
import { createUserSession } from "@/lib/session";

function redirectUrl(request: Request, path: string) {
  return new URL(path, request.url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await authenticate(formData);
  const wantsJson = request.headers.get("x-rutero-login-fetch") === "1";

  if ("ok" in result) {
    if (wantsJson) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    const params = new URLSearchParams({ error: result.message });
    const next = formData.get("next");
    if (typeof next === "string" && next) params.set("next", next);
    return NextResponse.redirect(redirectUrl(request, `/login?${params.toString()}`), 303);
  }

  await createUserSession(result.userId);
  if (wantsJson) {
    return NextResponse.json({ ok: true, redirectTo: result.redirectTo });
  }

  return NextResponse.redirect(redirectUrl(request, result.redirectTo), 303);
}
