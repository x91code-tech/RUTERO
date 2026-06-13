import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { demoClients, demoCollections, demoCompany, demoExpenses, demoLoans, demoNotifications, demoSales, demoUsers } from "@/lib/demo-data";
import type { Company, Notification, PaymentMethod } from "@/lib/types";

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function toCompany(company: {
  id: string;
  name: string;
  rif: string | null;
  countryCode: string;
  currencyCode: string;
  locale: string;
  timeZone: string;
}): Company {
  return {
    id: company.id,
    name: company.name,
    rif: company.rif ?? undefined,
    plan: "PRO",
    countryCode: company.countryCode,
    currencyCode: company.currencyCode,
    locale: company.locale,
    timeZone: company.timeZone
  };
}

export type DashboardMovement = {
  id: string;
  type: "Prestamo" | "Recaudo" | "Gasto" | "Venta";
  clientName?: string;
  sellerName?: string;
  paymentMethod?: PaymentMethod;
  amount: number;
};

export async function getDashboardData() {
  const user = await getSessionUser();
  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();

  if (!user) {
    const activeLoans = demoLoans.filter((loan) => loan.status === "ACTIVE");
    return {
      company: demoCompany,
      metrics: {
        activeLoanBalance: activeLoans.reduce((total, loan) => total + loan.balance, 0),
        expectedToday: activeLoans.reduce((total, loan) => total + Math.min(loan.dailyPayment, loan.balance), 0),
        collectedToday: demoCollections.reduce((total, collection) => total + collection.amount, 0),
        expensesToday: demoExpenses.reduce((total, expense) => total + expense.amount, 0),
        overdueLoans: activeLoans.filter((loan) => new Date(loan.dueDate) < new Date()).length,
        pendingClients: demoClients.filter((client) => client.status === "PENDING").length,
        activeSellers: demoUsers.filter((item) => item.role === "SELLER").length
      },
      sellerCollections: [{ label: "Vendedor Demo", value: demoCollections.reduce((total, collection) => total + collection.amount, 0) }],
      recentMovements: [
        ...demoLoans.map((loan) => ({ id: loan.id, type: "Prestamo" as const, clientName: demoClients.find((client) => client.id === loan.clientId)?.name, amount: loan.principalAmount })),
        ...demoCollections.map((collection) => ({ id: collection.id, type: "Recaudo" as const, clientName: demoClients.find((client) => client.id === collection.clientId)?.name, paymentMethod: collection.paymentMethod, amount: collection.amount })),
        ...demoSales.map((sale) => ({ id: sale.id, type: "Venta" as const, clientName: demoClients.find((client) => client.id === sale.clientId)?.name, paymentMethod: sale.paymentMethod, amount: sale.amount }))
      ].slice(0, 8),
      notifications: demoNotifications
    };
  }

  const [company, clients, users, loans, collectionsToday, expensesToday, salesToday, notifications] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
    prisma.client.findMany({ where: { companyId: user.companyId }, select: { id: true, name: true, status: true } }),
    prisma.user.findMany({ where: { companyId: user.companyId, active: true }, select: { id: true, name: true, role: true } }),
    prisma.loan.findMany({
      where: { companyId: user.companyId, status: "ACTIVE" },
      include: { client: { select: { name: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.collection.findMany({
      where: { companyId: user.companyId, date: { gte: todayStart, lt: todayEnd } },
      include: { client: { select: { name: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.expense.findMany({
      where: { companyId: user.companyId, date: { gte: todayStart, lt: todayEnd } },
      include: { seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 25
    }),
    prisma.sale.findMany({
      where: { companyId: user.companyId, date: { gte: todayStart, lt: todayEnd } },
      include: { client: { select: { name: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 25
    }),
    prisma.notification.findMany({ where: { companyId: user.companyId }, orderBy: { createdAt: "desc" }, take: 8 })
  ]);

  const sellerCollections = users
    .filter((item) => item.role === "SELLER" || item.role === "SUPERVISOR")
    .map((seller) => ({
      label: seller.name,
      value: collectionsToday
        .filter((collection) => collection.sellerId === seller.id)
        .reduce((total, collection) => total + Number(collection.amount), 0)
    }))
    .filter((item) => item.value > 0);
  const generatedNotifications: Notification[] = [
    ...(loans.filter((loan) => loan.dueDate < todayStart && Number(loan.balance) > 0).length
      ? [{
          id: "generated_overdue_loans",
          companyId: user.companyId,
          title: "Prestamos vencidos",
          message: "Hay prestamos activos con fecha vencida y saldo pendiente.",
          severity: "warning" as const
        }]
      : []),
    ...(clients.filter((client) => client.status === "PENDING").length
      ? [{
          id: "generated_pending_clients",
          companyId: user.companyId,
          title: "Clientes por verificar",
          message: "Hay clientes pendientes de aprobacion antes de otorgar prestamos.",
          severity: "warning" as const
        }]
      : [])
  ];

  return {
    company: toCompany(company),
    metrics: {
      activeLoanBalance: loans.reduce((total, loan) => total + Number(loan.balance), 0),
      expectedToday: loans.reduce((total, loan) => total + Math.min(Number(loan.dailyPayment), Number(loan.balance)), 0),
      collectedToday: collectionsToday.reduce((total, collection) => total + Number(collection.amount), 0),
      expensesToday: expensesToday.reduce((total, expense) => total + Number(expense.amount), 0),
      overdueLoans: loans.filter((loan) => loan.dueDate < todayStart && Number(loan.balance) > 0).length,
      pendingClients: clients.filter((client) => client.status === "PENDING").length,
      activeSellers: users.filter((item) => item.role === "SELLER").length
    },
    sellerCollections: sellerCollections.length ? sellerCollections : [{ label: "Sin recaudos", value: 0 }],
    recentMovements: [
      ...loans.slice(0, 8).map((loan) => ({
        id: loan.id,
        type: "Prestamo" as const,
        clientName: loan.client.name,
        sellerName: loan.seller.name,
        amount: Number(loan.principalAmount)
      })),
      ...collectionsToday.map((collection) => ({
        id: collection.id,
        type: "Recaudo" as const,
        clientName: collection.client.name,
        sellerName: collection.seller.name,
        paymentMethod: collection.paymentMethod,
        amount: Number(collection.amount)
      })),
      ...salesToday.map((sale) => ({
        id: sale.id,
        type: "Venta" as const,
        clientName: sale.client.name,
        sellerName: sale.seller.name,
        paymentMethod: sale.paymentMethod,
        amount: Number(sale.amount)
      })),
      ...expensesToday.map((expense) => ({
        id: expense.id,
        type: "Gasto" as const,
        sellerName: expense.seller.name,
        paymentMethod: expense.paymentMethod,
        amount: Number(expense.amount)
      }))
    ].slice(0, 10) satisfies DashboardMovement[],
    notifications: [...generatedNotifications, ...notifications.map((notification) => ({
      id: notification.id,
      companyId: notification.companyId,
      title: notification.title,
      message: notification.message,
      severity: notification.severity as Notification["severity"]
    }))]
  };
}
