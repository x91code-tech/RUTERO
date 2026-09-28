"use server";

import { redirect } from "next/navigation";
import { authenticate, authenticateMobile, type AuthFormState } from "@/lib/auth-login";
import { clearUserSession, createUserSession } from "@/lib/session";

export type { AuthFormState };

export async function loginAction(formData: FormData) {
  const result = await authenticate(formData);
  if ("ok" in result) redirect(`/login?error=${encodeURIComponent(result.message)}`);

  await createUserSession(result.userId);
  redirect(result.redirectTo);
}

export async function loginFormAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await authenticate(formData);
  if ("ok" in result) return result;

  await createUserSession(result.userId);
  redirect(result.redirectTo);
}

export async function mobileLoginFormAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const result = await authenticateMobile(formData);
  if ("ok" in result) return result;

  await createUserSession(result.userId);
  redirect(result.redirectTo);
}

export async function registerCompanyAction(formData: FormData) {
  void formData;
  redirect("/login");
}

export async function registerCompanyFormAction(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  void _state;
  void formData;
  return { ok: false, message: "El registro de empresas no esta disponible. Contacta al propietario de RUTERO." };
}

export async function logoutAction() {
  await clearUserSession();
  redirect("/login");
}
