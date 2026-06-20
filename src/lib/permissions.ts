import type { Cashbox, Role, User } from "@/lib/types";

const roleAccess: Record<Role, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["/dashboard", "/clients", "/routes", "/loans", "/collections", "/expenses", "/cashbox", "/reports", "/notifications", "/settings", "/seller"],
  SUPERVISOR: ["/dashboard", "/clients", "/routes", "/loans", "/collections", "/expenses", "/cashbox", "/reports", "/notifications", "/seller"],
  SELLER: ["/seller", "/clients", "/routes", "/loans", "/collections", "/expenses", "/cashbox", "/notifications"]
};

export function canRoleAccessPath(role: Role, path: string) {
  const allowedPaths = roleAccess[role] ?? [];
  if (allowedPaths.includes("*")) return true;
  return allowedPaths.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`));
}

export function getDefaultPathForRole(role: Role) {
  if (role === "SELLER") return "/seller";
  return "/dashboard";
}

export function canManageUsers(role: Role) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canManageCompany(role: Role) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canApproveClients(role: Role) {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPERVISOR";
}

export function canCreateLoans(role: Role) {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPERVISOR" || role === "SELLER";
}

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
