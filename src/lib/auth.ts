import { getSessionUser } from "@/lib/session";

export async function getCurrentUser() {
  return getSessionUser();
}
