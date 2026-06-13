import type { Cashbox, Role, User } from "@/lib/types";

export function canUserAccessCompany(user: User, companyId: string) {
  if (user.role === "SUPER_ADMIN") return true;
  return user.companyId === companyId;
}

export function canUserModifyCashbox(user: User, cashbox: Cashbox) {
  if (!canUserAccessCompany(user, cashbox.companyId)) return false;
  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") return true;
  if (user.role === "SUPERVISOR") return cashbox.status !== "CLOSED";
  return user.id === cashbox.sellerId && cashbox.status === "OPEN";
}

export function canDeleteFinancialMovement(role: Role) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
