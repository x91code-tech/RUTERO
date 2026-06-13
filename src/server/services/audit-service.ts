import type { User } from "@/lib/types";

export type AuditInput = {
  user: User;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
  userAgent?: string;
};

export async function writeAuditLog(input: AuditInput) {
  // Wire this to Prisma AuditLog when database mutations are enabled.
  return {
    companyId: input.user.companyId,
    userId: input.user.id,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    createdAt: new Date().toISOString()
  };
}
