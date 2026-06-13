"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { createRouteSchema } from "@/lib/validations";

export async function createRouteAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "SUPERVISOR"].includes(user.role)) redirect("/routes?error=permission");

  const payload = createRouteSchema.parse(Object.fromEntries(formData));
  const existingRoute = await prisma.route.findUnique({
    where: { companyId_name: { companyId: user.companyId, name: payload.name } }
  });
  if (existingRoute) redirect("/routes?error=route_exists");

  const route = await prisma.route.create({
    data: {
      companyId: user.companyId,
      name: payload.name,
      zone: payload.zone,
      sellerId: payload.sellerId || null
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      action: "ROUTE_CREATED",
      entity: "Route",
      entityId: route.id,
      newValue: payload
    }
  });

  revalidatePath("/routes");
  revalidatePath("/clients");
}
