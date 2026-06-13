"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ClientLocationType } from "@prisma/client";
import { getClientDocumentRequirements } from "@/lib/countries";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { clientDocumentSchema, clientLocationSchema, createClientSchema, verifyClientSchema } from "@/lib/validations";

export async function createClientAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const payload = createClientSchema.parse(Object.fromEntries(formData));
  const company = await prisma.company.findUniqueOrThrow({ where: { id: user.companyId } });
  const sellerId = payload.sellerId || user.id;

  const duplicatedClient = await prisma.client.findFirst({
    where: {
      companyId: user.companyId,
      OR: [
        { document: payload.document },
        { phone: payload.phone }
      ]
    }
  });

  if (duplicatedClient) redirect("/clients?error=duplicate");

  const createdClient = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        companyId: user.companyId,
        sellerId,
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        document: payload.document,
        latitude: payload.storeLatitude,
        longitude: payload.storeLongitude,
        status: "PENDING",
        notes: payload.notes
      }
    });

    if (payload.routeId) {
      const lastRouteClient = await tx.routeClient.findFirst({
        where: { routeId: payload.routeId },
        orderBy: { visitOrder: "desc" }
      });

      await tx.routeClient.create({
        data: {
          routeId: payload.routeId,
          clientId: client.id,
          visitOrder: (lastRouteClient?.visitOrder ?? 0) + 1
        }
      });
    }

    if (payload.storeLatitude !== undefined && payload.storeLongitude !== undefined) {
      await tx.clientLocation.create({
        data: {
          clientId: client.id,
          label: "Ubicación tienda",
          type: ClientLocationType.STORE,
          address: payload.address,
          latitude: payload.storeLatitude,
          longitude: payload.storeLongitude,
          isPrimary: true
        }
      });
    }

    if (
      payload.secondaryAddress &&
      payload.secondaryLatitude !== undefined &&
      payload.secondaryLongitude !== undefined
    ) {
      await tx.clientLocation.create({
        data: {
          clientId: client.id,
          label: "Segunda ubicación",
          type: ClientLocationType.BILLING,
          address: payload.secondaryAddress,
          latitude: payload.secondaryLatitude,
          longitude: payload.secondaryLongitude,
          isPrimary: false
        }
      });
    }

    await tx.clientDocument.createMany({
      data: getClientDocumentRequirements(company.countryCode).map((requirement) => ({
        clientId: client.id,
        countryCode: company.countryCode,
        documentType: requirement.type,
        label: requirement.label,
        required: requirement.required,
        status: "PENDING",
        notes: requirement.description
      }))
    });

    await tx.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: "CLIENT_CREATED",
        entity: "Client",
        entityId: client.id,
        newValue: payload
      }
    });

    return client;
  });

  revalidatePath("/clients");
  redirect(`/clients/${createdClient.id}`);
}

export async function updateClientLocationAction(formData: FormData) {
  const payload = clientLocationSchema.parse(Object.fromEntries(formData));
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const client = await prisma.client.findFirstOrThrow({
    where: { id: payload.clientId, companyId: user.companyId }
  });

  await prisma.$transaction(async (tx) => {
    await tx.clientLocation.upsert({
      where: {
        id: `${payload.clientId}_${payload.type.toLowerCase()}`
      },
      update: {
        label: payload.label,
        type: payload.type,
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        isPrimary: payload.isPrimary
      },
      create: {
        id: `${payload.clientId}_${payload.type.toLowerCase()}`,
        clientId: payload.clientId,
        label: payload.label,
        type: payload.type,
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        isPrimary: payload.isPrimary
      }
    });

    if (payload.type === "STORE" || payload.isPrimary) {
      await tx.client.update({
        where: { id: client.id },
        data: {
          address: payload.address,
          latitude: payload.latitude,
          longitude: payload.longitude
        }
      });
    }
  });

  revalidatePath(`/clients/${payload.clientId}`);
  revalidatePath("/clients");
  revalidatePath("/routes");
}

export async function uploadClientDocumentAction(formData: FormData) {
  const payload = clientDocumentSchema.parse(Object.fromEntries(formData));
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const client = await prisma.client.findFirstOrThrow({
    where: { id: payload.clientId, companyId: user.companyId }
  });

  await prisma.clientDocument.upsert({
    where: {
      clientId_documentType: {
        clientId: client.id,
        documentType: payload.documentType
      }
    },
    update: {
      countryCode: payload.countryCode,
      label: payload.label,
      required: payload.required,
      fileUrl: payload.fileUrl,
      notes: payload.notes,
      status: payload.fileUrl ? "UPLOADED" : "PENDING",
      uploadedAt: payload.fileUrl ? new Date() : null
    },
    create: {
      clientId: client.id,
      countryCode: payload.countryCode,
      documentType: payload.documentType,
      label: payload.label,
      required: payload.required,
      fileUrl: payload.fileUrl,
      notes: payload.notes,
      status: payload.fileUrl ? "UPLOADED" : "PENDING",
      uploadedAt: payload.fileUrl ? new Date() : null
    }
  });

  revalidatePath(`/clients/${payload.clientId}`);
  revalidatePath("/clients");
}

export async function verifyClientAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!["ADMIN", "SUPER_ADMIN", "SUPERVISOR"].includes(user.role)) redirect("/clients?error=permission");

  const payload = verifyClientSchema.parse(Object.fromEntries(formData));
  const client = await prisma.client.findFirstOrThrow({
    where: { id: payload.clientId, companyId: user.companyId }
  });

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: {
      status: payload.decision === "APPROVE" ? "ACTIVE" : "INACTIVE",
      notes: payload.notes || client.notes
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      action: payload.decision === "APPROVE" ? "CLIENT_APPROVED" : "CLIENT_REJECTED",
      entity: "Client",
      entityId: client.id,
      oldValue: { status: client.status },
      newValue: { status: updatedClient.status, notes: payload.notes }
    }
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${client.id}`);
}
