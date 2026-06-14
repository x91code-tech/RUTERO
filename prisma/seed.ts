import { PrismaClient, Role, PaymentMethod, ClientStatus, CashboxStatus, ClientLocationType, ClientDocumentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getClientDocumentRequirements } from "../src/lib/countries";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "company_rutero_demo" },
    update: {},
    create: {
      id: "company_rutero_demo",
      name: "RUTERO Demo",
      rif: "J-00000000-0",
      countryCode: "VE",
      currencyCode: "VES",
      locale: "es-VE",
      timeZone: "America/Caracas",
      subscription: { create: { name: "PRO", maxUsers: 20, maxSellers: 10 } }
    }
  });

  const adminPassword = await bcrypt.hash("Admin123456", 10);
  const sellerPassword = await bcrypt.hash("Cobrador123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@rutero.app" },
    update: {},
    create: { companyId: company.id, name: "Admin RUTERO", email: "admin@rutero.app", passwordHash: adminPassword, role: Role.ADMIN }
  });

  const seller = await prisma.user.upsert({
    where: { email: "cobrador@rutero.app" },
    update: {},
    create: { companyId: company.id, name: "Cobrador Demo", email: "cobrador@rutero.app", passwordHash: sellerPassword, role: Role.SELLER }
  });

  const routeCentro = await prisma.route.upsert({
    where: { companyId_name: { companyId: company.id, name: "Ruta Centro" } },
    update: { sellerId: seller.id, zone: "Centro" },
    create: { companyId: company.id, sellerId: seller.id, name: "Ruta Centro", zone: "Centro" }
  });
  for (const route of [
    { name: "Ruta Norte", zone: "Norte" },
    { name: "Ruta Sur", zone: "Sur" }
  ]) {
    await prisma.route.upsert({
      where: { companyId_name: { companyId: company.id, name: route.name } },
      update: { sellerId: seller.id, zone: route.zone },
      create: { companyId: company.id, sellerId: seller.id, name: route.name, zone: route.zone }
    });
  }

  const clientNames = ["Carlos Pérez", "María González", "José Ramírez", "Ana Torres", "Luis Fernández"];
  for (const [index, name] of clientNames.entries()) {
    const document = `V-${12345678 + index}`;
    const client = await prisma.client.upsert({
      where: { companyId_document: { companyId: company.id, document } },
      update: {
        sellerId: seller.id,
        name,
        phone: `+58 412-555-010${index}`,
        address: `Dirección comercial ${index + 1}`,
        latitude: 10.5 + index * 0.004,
        longitude: -66.91 - index * 0.003,
        pendingBalance: index % 2 === 0 ? 240 : 0,
        status: index === 2 ? ClientStatus.DELINQUENT : ClientStatus.ACTIVE,
        notes: "Cliente demo para probar rutas y recaudos."
      },
      create: {
        companyId: company.id,
        sellerId: seller.id,
        name,
        phone: `+58 412-555-010${index}`,
        address: `Dirección comercial ${index + 1}`,
        latitude: 10.5 + index * 0.004,
        longitude: -66.91 - index * 0.003,
        document,
        pendingBalance: index % 2 === 0 ? 240 : 0,
        status: index === 2 ? ClientStatus.DELINQUENT : ClientStatus.ACTIVE,
        notes: "Cliente demo para probar rutas y recaudos."
      }
    });

    await prisma.routeClient.upsert({
      where: { routeId_clientId: { routeId: routeCentro.id, clientId: client.id } },
      update: { visitOrder: index + 1 },
      create: { routeId: routeCentro.id, clientId: client.id, visitOrder: index + 1 }
    });
    await prisma.clientLocation.deleteMany({ where: { clientId: client.id } });
    await prisma.clientLocation.createMany({
      data: [
        {
          clientId: client.id,
          label: "Ubicación tienda",
          type: ClientLocationType.STORE,
          address: client.address,
          latitude: client.latitude ?? 10.5,
          longitude: client.longitude ?? -66.91,
          isPrimary: true
        },
        {
          clientId: client.id,
          label: "Ubicación administrativa",
          type: ClientLocationType.BILLING,
          address: `${client.address} · oficina o punto de facturación`,
          latitude: Number(client.latitude ?? 10.5) + 0.0015,
          longitude: Number(client.longitude ?? -66.91) - 0.0015,
          isPrimary: false
        }
      ]
    });
    for (const [requirementIndex, requirement] of getClientDocumentRequirements("VE").entries()) {
      await prisma.clientDocument.upsert({
        where: { clientId_documentType: { clientId: client.id, documentType: requirement.type } },
        update: {
          countryCode: "VE",
          label: requirement.label,
          required: requirement.required,
          notes: requirement.description
        },
        create: {
          clientId: client.id,
          countryCode: "VE",
          documentType: requirement.type,
          label: requirement.label,
          required: requirement.required,
          status: requirementIndex === 0 ? ClientDocumentStatus.UPLOADED : ClientDocumentStatus.PENDING,
          fileUrl: requirementIndex === 0 ? `/demo-documents/${client.id}-${requirement.type.toLowerCase()}.pdf` : null,
          notes: requirement.description
        }
      });
    }
  }

  const product = await prisma.product.upsert({
    where: { companyId_name: { companyId: company.id, name: "Combo recarga rápida" } },
    update: { price: 35, cost: 21, stock: 64, minStock: 20, active: true },
    create: { companyId: company.id, name: "Combo recarga rápida", price: 35, cost: 21, stock: 64, minStock: 20 }
  });

  const firstClient = await prisma.client.findFirstOrThrow({ where: { companyId: company.id } });
  await prisma.sale.upsert({
    where: {
      companyId_clientId_sellerId_concept_date: {
        companyId: company.id,
        clientId: firstClient.id,
        sellerId: seller.id,
        concept: "Pedido mixto",
        date: new Date("2026-06-12")
      }
    },
    update: { amount: 840, paymentMethod: PaymentMethod.CASH_USD, productId: product.id },
    create: {
      companyId: company.id,
      sellerId: seller.id,
      clientId: firstClient.id,
      productId: product.id,
      concept: "Pedido mixto",
      amount: 840,
      paymentMethod: PaymentMethod.CASH_USD,
      date: new Date("2026-06-12")
    }
  });

  await prisma.collection.upsert({
    where: {
      companyId_clientId_sellerId_date_amount: {
        companyId: company.id,
        clientId: firstClient.id,
        sellerId: seller.id,
        date: new Date("2026-06-12"),
        amount: 400
      }
    },
    update: { previousBalance: 640, newBalance: 240, paymentMethod: PaymentMethod.CASH_USD },
    create: {
      companyId: company.id,
      sellerId: seller.id,
      clientId: firstClient.id,
      amount: 400,
      previousBalance: 640,
      newBalance: 240,
      paymentMethod: PaymentMethod.CASH_USD,
      date: new Date("2026-06-12")
    }
  });

  await prisma.expense.upsert({
    where: {
      companyId_sellerId_type_date_amount: {
        companyId: company.id,
        sellerId: seller.id,
        type: "Gasolina",
        date: new Date("2026-06-12"),
        amount: 80
      }
    },
    update: { paymentMethod: PaymentMethod.CASH_USD, comment: "Recarga para Ruta Centro" },
    create: {
      companyId: company.id,
      sellerId: seller.id,
      type: "Gasolina",
      amount: 80,
      paymentMethod: PaymentMethod.CASH_USD,
      date: new Date("2026-06-12"),
      comment: "Recarga para Ruta Centro"
    }
  });

  await prisma.cashbox.upsert({
    where: { sellerId_date: { sellerId: seller.id, date: new Date("2026-06-12") } },
    update: {
      initialCash: 375,
      reportedCash: 1535,
      reportedTransfer: 1200,
      reportedPix: 800,
      expectedCash: 1535,
      difference: 0,
      status: CashboxStatus.BALANCED,
      observations: "Ruta cerrada sin diferencias."
    },
    create: {
      companyId: company.id,
      sellerId: seller.id,
      date: new Date("2026-06-12"),
      initialCash: 375,
      reportedCash: 1535,
      reportedTransfer: 1200,
      reportedPix: 800,
      expectedCash: 1535,
      difference: 0,
      status: CashboxStatus.BALANCED,
      observations: "Ruta cerrada sin diferencias."
    }
  });

  await prisma.notification.deleteMany({ where: { companyId: company.id, title: "Caja cuadrada" } });
  await prisma.notification.create({
    data: {
      companyId: company.id,
      title: "Caja cuadrada",
      message: "Cobrador Demo cerro la caja sin diferencias.",
      severity: "info"
    }
  });

  const existingSeedAudit = await prisma.auditLog.findFirst({
    where: { companyId: company.id, action: "SEED_DEMO_CREATED", entity: "Company", entityId: company.id }
  });
  if (!existingSeedAudit) {
    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        userId: admin.id,
        action: "SEED_DEMO_CREATED",
        entity: "Company",
        entityId: company.id,
        newValue: { demo: true }
      }
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
