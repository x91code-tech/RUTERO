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
  const sellerPassword = await bcrypt.hash("Vendedor123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@rutero.app" },
    update: {},
    create: { companyId: company.id, name: "Admin RUTERO", email: "admin@rutero.app", passwordHash: adminPassword, role: Role.ADMIN }
  });

  const seller = await prisma.user.upsert({
    where: { email: "vendedor@rutero.app" },
    update: {},
    create: { companyId: company.id, name: "Vendedor Demo", email: "vendedor@rutero.app", passwordHash: sellerPassword, role: Role.SELLER }
  });

  const routeCentro = await prisma.route.create({ data: { companyId: company.id, sellerId: seller.id, name: "Ruta Centro", zone: "Centro" } });
  await prisma.route.createMany({
    data: [
      { companyId: company.id, sellerId: seller.id, name: "Ruta Norte", zone: "Norte" },
      { companyId: company.id, sellerId: seller.id, name: "Ruta Sur", zone: "Sur" }
    ]
  });

  const clientNames = ["Carlos Pérez", "María González", "José Ramírez", "Ana Torres", "Luis Fernández"];
  for (const [index, name] of clientNames.entries()) {
    const client = await prisma.client.create({
      data: {
        companyId: company.id,
        sellerId: seller.id,
        name,
        phone: `+58 412-555-010${index}`,
        address: `Dirección comercial ${index + 1}`,
        latitude: 10.5 + index * 0.004,
        longitude: -66.91 - index * 0.003,
        document: `V-${12345678 + index}`,
        pendingBalance: index % 2 === 0 ? 240 : 0,
        status: index === 2 ? ClientStatus.DELINQUENT : ClientStatus.ACTIVE,
        notes: "Cliente demo para probar rutas y recaudos."
      }
    });

    await prisma.routeClient.create({ data: { routeId: routeCentro.id, clientId: client.id, visitOrder: index + 1 } });
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
    await prisma.clientDocument.createMany({
      data: getClientDocumentRequirements("VE").map((requirement, requirementIndex) => ({
        clientId: client.id,
        countryCode: "VE",
        documentType: requirement.type,
        label: requirement.label,
        required: requirement.required,
        status: requirementIndex === 0 ? ClientDocumentStatus.UPLOADED : ClientDocumentStatus.PENDING,
        fileUrl: requirementIndex === 0 ? `/demo-documents/${client.id}-${requirement.type.toLowerCase()}.pdf` : null,
        notes: requirement.description
      }))
    });
  }

  const product = await prisma.product.create({
    data: { companyId: company.id, name: "Combo recarga rápida", price: 35, cost: 21, stock: 64, minStock: 20 }
  });

  const firstClient = await prisma.client.findFirstOrThrow({ where: { companyId: company.id } });
  await prisma.sale.create({
    data: {
      companyId: company.id,
      sellerId: seller.id,
      clientId: firstClient.id,
      productId: product.id,
      concept: "Pedido mixto",
      amount: 840,
      paymentMethod: PaymentMethod.CASH,
      date: new Date("2026-06-12")
    }
  });

  await prisma.collection.create({
    data: {
      companyId: company.id,
      sellerId: seller.id,
      clientId: firstClient.id,
      amount: 400,
      previousBalance: 640,
      newBalance: 240,
      paymentMethod: PaymentMethod.CASH,
      date: new Date("2026-06-12")
    }
  });

  await prisma.expense.create({
    data: {
      companyId: company.id,
      sellerId: seller.id,
      type: "Gasolina",
      amount: 80,
      paymentMethod: PaymentMethod.CASH,
      date: new Date("2026-06-12"),
      comment: "Recarga para Ruta Centro"
    }
  });

  await prisma.cashbox.create({
    data: {
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

  await prisma.notification.create({
    data: {
      companyId: company.id,
      title: "Caja cuadrada",
      message: "Vendedor Demo cerró la caja sin diferencias.",
      severity: "info"
    }
  });

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

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
