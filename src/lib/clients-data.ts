import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import {
  demoClientDocuments,
  demoClientLocations,
  demoClients,
  demoCollections,
  demoCompany,
  demoLoans,
  demoRoutes,
  demoSales,
  demoUsers
} from "@/lib/demo-data";
import type { Client, ClientDocument, ClientLocation, Company, Loan, Route, User } from "@/lib/types";

export async function getClientsPageData() {
  const user = await getSessionUser();
  if (!user) {
    return {
      company: demoCompany,
      clients: demoClients,
      routes: demoRoutes,
      users: demoUsers,
      locations: demoClientLocations,
      documents: demoClientDocuments,
      isDemo: true
    };
  }

  const clientWhere = { companyId: user.companyId, ...(user.role === "SELLER" ? { sellerId: user.id } : {}) };
  const routeWhere = { companyId: user.companyId, ...(user.role === "SELLER" ? { sellerId: user.id } : {}) };
  const [company, clients, routes, users, locations, documents] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
    prisma.client.findMany({ where: clientWhere, include: { routeClients: true }, orderBy: { createdAt: "desc" } }),
    prisma.route.findMany({ where: routeWhere, include: { routeClients: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { companyId: user.companyId, active: true, ...(user.role === "SELLER" ? { id: user.id } : {}) }, orderBy: { name: "asc" } }),
    prisma.clientLocation.findMany({ where: { client: clientWhere } }),
    prisma.clientDocument.findMany({ where: { client: clientWhere } })
  ]);

  return {
    company: {
      id: company.id,
      name: company.name,
      rif: company.rif ?? undefined,
      plan: "PRO",
      countryCode: company.countryCode,
      currencyCode: company.currencyCode,
      locale: company.locale,
      timeZone: company.timeZone
    } satisfies Company,
    clients: clients.map(toClient),
    routes: routes.map((route) => ({
      id: route.id,
      companyId: route.companyId,
      name: route.name,
      zone: route.zone,
      sellerId: route.sellerId ?? "",
      clientIds: route.routeClients.map((routeClient) => routeClient.clientId)
    })) satisfies Route[],
    users: users.map((item) => ({
      id: item.id,
      companyId: item.companyId,
      name: item.name,
      email: item.email,
      mobileIdentifier: item.mobileIdentifier ?? undefined,
      mobileDeviceBoundAt: item.mobileDeviceBoundAt?.toISOString(),
      mobileDeviceName: item.mobileDeviceName ?? undefined,
      role: item.role
    })) satisfies User[],
    locations: locations.map((location) => ({
      id: location.id,
      clientId: location.clientId,
      label: location.label,
      type: location.type,
      address: location.address,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      isPrimary: location.isPrimary
    })) satisfies ClientLocation[],
    documents: documents.map((document) => ({
      id: document.id,
      clientId: document.clientId,
      countryCode: document.countryCode,
      documentType: document.documentType,
      label: document.label,
      required: document.required,
      status: document.status,
      fileUrl: document.fileUrl ?? undefined,
      notes: document.notes ?? undefined
    })) satisfies ClientDocument[],
    isDemo: false
  };
}

export async function getClientProfileData(id: string) {
  const user = await getSessionUser();
  if (!user) {
    const baseClient = demoClients.find((item) => item.id === id);
    if (!baseClient) return null;
    return {
      company: demoCompany,
      client: {
        ...baseClient,
        locations: demoClientLocations.filter((location) => location.clientId === baseClient.id),
        documents: demoClientDocuments.filter((document) => document.clientId === baseClient.id)
      },
      route: demoRoutes.find((route) => route.id === baseClient.routeId) ?? null,
      loans: demoLoans.filter((loan) => loan.clientId === baseClient.id),
      sales: demoSales.filter((sale) => sale.clientId === baseClient.id),
      collections: demoCollections.filter((collection) => collection.clientId === baseClient.id)
    };
  }

  const client = await prisma.client.findFirst({
    where: { id, companyId: user.companyId, ...(user.role === "SELLER" ? { sellerId: user.id } : {}) },
    include: {
      locations: true,
      documents: true,
      routeClients: { include: { route: true } },
      loans: { orderBy: { createdAt: "desc" }, take: 20 },
      sales: { orderBy: { createdAt: "desc" }, take: 20 },
      collections: { orderBy: { createdAt: "desc" }, take: 20 },
      company: true
    }
  });
  if (!client) return null;

  return {
    company: {
      id: client.company.id,
      name: client.company.name,
      rif: client.company.rif ?? undefined,
      plan: "PRO",
      countryCode: client.company.countryCode,
      currencyCode: client.company.currencyCode,
      locale: client.company.locale,
      timeZone: client.company.timeZone
    } satisfies Company,
    client: {
      ...toClient(client),
      locations: client.locations.map((location) => ({
        id: location.id,
        clientId: location.clientId,
        label: location.label,
        type: location.type,
        address: location.address,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        isPrimary: location.isPrimary
      })),
      documents: client.documents.map((document) => ({
        id: document.id,
        clientId: document.clientId,
        countryCode: document.countryCode,
        documentType: document.documentType,
        label: document.label,
        required: document.required,
        status: document.status,
        fileUrl: document.fileUrl ?? undefined,
        notes: document.notes ?? undefined
      }))
    },
    route: client.routeClients[0]?.route
      ? {
          id: client.routeClients[0].route.id,
          companyId: client.routeClients[0].route.companyId,
          name: client.routeClients[0].route.name,
          zone: client.routeClients[0].route.zone,
          sellerId: client.routeClients[0].route.sellerId ?? "",
          clientIds: [client.id]
        }
      : null,
    loans: client.loans.map((loan) => ({
      id: loan.id,
      companyId: loan.companyId,
      clientId: loan.clientId,
      sellerId: loan.sellerId,
      principalAmount: Number(loan.principalAmount),
      interestRate: Number(loan.interestRate),
      interestAmount: Number(loan.interestAmount),
      totalAmount: Number(loan.totalAmount),
      dailyPayment: Number(loan.dailyPayment),
      paidAmount: Number(loan.paidAmount),
      balance: Number(loan.balance),
      principalBalance: Number(loan.principalBalance),
      interestBalance: Number(loan.interestBalance),
      lateFeeBalance: Number(loan.lateFeeBalance),
      installmentsPaid: Number(loan.installmentsPaid),
      termDays: loan.termDays,
      startDate: loan.startDate.toISOString(),
      dueDate: loan.dueDate.toISOString(),
      status: loan.status,
      notes: loan.notes ?? undefined
    })) satisfies Loan[],
    sales: client.sales.map((sale) => ({
      id: sale.id,
      companyId: sale.companyId,
      clientId: sale.clientId,
      sellerId: sale.sellerId,
      product: sale.concept,
      amount: Number(sale.amount),
      paymentMethod: sale.paymentMethod,
      date: sale.date.toISOString(),
      observation: sale.observation ?? undefined
    })),
    collections: client.collections.map((collection) => ({
      id: collection.id,
      companyId: collection.companyId,
      clientId: collection.clientId,
      loanId: collection.loanId ?? undefined,
      sellerId: collection.sellerId,
      amount: Number(collection.amount),
      paymentType: collection.paymentType,
      application: collection.application,
      balanceApplied: Number(collection.balanceApplied),
      principalApplied: Number(collection.principalApplied),
      interestApplied: Number(collection.interestApplied),
      lateFeeApplied: Number(collection.lateFeeApplied),
      additionalApplied: Number(collection.additionalApplied),
      overpaymentAmount: Number(collection.overpaymentAmount),
      installmentsCovered: Number(collection.installmentsCovered),
      previousBalance: Number(collection.previousBalance),
      newBalance: Number(collection.newBalance),
      paymentMethod: collection.paymentMethod,
      date: collection.date.toISOString(),
      observation: collection.observation ?? undefined
    }))
  };
}

function toClient(client: {
  id: string;
  companyId: string;
  sellerId: string;
  name: string;
  phone: string | null;
  address: string;
  latitude: unknown;
  longitude: unknown;
  document: string | null;
  pendingBalance: unknown;
  status: Client["status"];
  notes: string | null;
  routeClients?: { routeId: string }[];
}): Client {
  return {
    id: client.id,
    companyId: client.companyId,
    name: client.name,
    phone: client.phone ?? "",
    address: client.address,
    latitude: client.latitude ? Number(client.latitude) : undefined,
    longitude: client.longitude ? Number(client.longitude) : undefined,
    document: client.document ?? "",
    routeId: client.routeClients?.[0]?.routeId ?? "",
    sellerId: client.sellerId,
    pendingBalance: Number(client.pendingBalance),
    status: client.status,
    notes: client.notes ?? ""
  };
}
