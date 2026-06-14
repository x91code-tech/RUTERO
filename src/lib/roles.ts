import type { Role } from "@/lib/types";

export function roleLabel(role: Role) {
  const labels: Record<Role, string> = {
    SUPER_ADMIN: "Super admin",
    ADMIN: "Administrador",
    SUPERVISOR: "Supervisor",
    SELLER: "Cobrador"
  };

  return labels[role];
}

export function roleDescription(role: Role) {
  const descriptions: Record<Role, string> = {
    SUPER_ADMIN: "Acceso total a la plataforma.",
    ADMIN: "Gestiona empresa, usuarios, rutas y reportes.",
    SUPERVISOR: "Supervisa rutas, clientes, cobros y caja.",
    SELLER: "Cobra cuotas, registra gastos y atiende su ruta asignada."
  };

  return descriptions[role];
}

export function roleTone(role: Role): "green" | "orange" | "blue" | "gray" {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "green";
  if (role === "SELLER") return "orange";
  if (role === "SUPERVISOR") return "blue";
  return "gray";
}
