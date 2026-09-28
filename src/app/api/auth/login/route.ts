import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-login";
import { createUserSession } from "@/lib/session";

function redirectUrl(request: Request, path: string) {
  return new URL(path, request.url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await authenticate(formData);

  if ("ok" in result) {
    const params = new URLSearchParams({ error: result.message });
    const next = formData.get("next");
    if (typeof next === "string" && next) params.set("next", next);
    return NextResponse.redirect(redirectUrl(request, `/login?${params.toString()}`), 303);
  }

  await createUserSession(result.userId);
  return NextResponse.redirect(redirectUrl(request, result.redirectTo), 303);
}
