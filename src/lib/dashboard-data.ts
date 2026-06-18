import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { cashMovementKindLabels, getCashMovementImpact, isCashMovementOutflow, normalizeCashMovementKind } from "@/lib/cash-movements";
import { demoCashbox, demoClients, demoCollections, demoCompany, demoExpenses, demoLoans, demoNotifications, demoSales, demoUsers } from "@/lib/demo-data";
import { endOfLocalDay, startOfLocalDay } from "@/lib/date-utils";
import type { Cashbox, Collection, Company, Expense, Loan, Notification, PaymentMethod, Sale } from "@/lib/types";

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

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export type DashboardMovement = {
  id: string;
  type: "Prestamo" | "Recaudo" | "Gasto" | "Retiro" | "Entrada" | "Venta";
  clientName?: string;
  sellerName?: string;
  paymentMethod?: PaymentMethod;
  amount: number;
};

export async function getDashboardData() {
  const user = await getSessionUser();
  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const movementDateScope = { OR: [{ date: { gte: todayStart, lt: todayEnd } }, { createdAt: { gte: todayStart, lt: todayEnd } }] };

  if (!user) {
    const activeLoans = demoLoans.filter((loan) => loan.status === "ACTIVE");
    const demoSummary = calculateDailySummary({
      cashbox: demoCashbox,
      sales: demoSales,
      collections: demoCollections,
      expenses: demoExpenses,
      loans: demoLoans,
      countryCode: demoCompany.countryCode
    });
    return {
      company: demoCompany,
      metrics: {
        activeLoanBalance: activeLoans.reduce((total, loan) => total + loan.balance, 0),
        expectedToday: activeLoans.reduce((total, loan) => total + Math.min(loan.dailyPayment, loan.balance), 0),
        collectedToday: demoCollections.reduce((total, collection) => total + collection.amount, 0),
        loanDisbursementsToday: demoSummary.loanDisbursementsTotal,
        cashboxExpectedToday: demoSummary.expectedCash,
        cashInflowsToday: demoSummary.cashInflows,
        cashOutflowsToday: demoSummary.cashOutflows,
        expensesToday: demoExpenses.filter((expense) => isCashMovementOutflow(expense.movementKind)).reduce((total, expense) => total + expense.amount, 0),
        overdueLoans: activeLoans.filter((loan) => new Date(loan.dueDate) < new Date()).length,
        pendingClients: demoClients.filter((client) => client.status === "PENDING").length,
        activeSellers: demoUsers.filter((item) => item.role === "SELLER").length
      },
      sellerCollections: [{ label: "Cobrador Demo", value: demoCollections.reduce((total, collection) => total + collection.amount, 0) }],
      recentMovements: [
        ...demoLoans.map((loan) => ({ id: loan.id, type: "Prestamo" as const, clientName: demoClients.find((client) => client.id === loan.clientId)?.name, amount: loan.principalAmount })),
        ...demoCollections.map((collection) => ({ id: collection.id, type: "Recaudo" as const, clientName: demoClients.find((client) => client.id === collection.clientId)?.name, paymentMethod: collection.paymentMethod, amount: collection.amount })),
        ...demoSales.map((sale) => ({ id: sale.id, type: "Venta" as const, clientName: demoClients.find((client) => client.id === sale.clientId)?.name, paymentMethod: sale.paymentMethod, amount: sale.amount })),
        ...demoExpenses.map((expense) => ({ id: expense.id, type: cashMovementKindLabels[expense.movementKind], sellerName: demoUsers.find((seller) => seller.id === expense.sellerId)?.name, paymentMethod: expense.paymentMethod, amount: getCashMovementImpact(expense.amount, expense.movementKind) }))
      ].slice(0, 8),
      notifications: demoNotifications
    };
  }

  const [company, clients, users, loans, loansToday, collectionsToday, expensesToday, salesToday, cashboxesToday, notifications] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
    prisma.client.findMany({ where: { companyId: user.companyId }, select: { id: true, name: true, status: true } }),
    prisma.user.findMany({ where: { companyId: user.companyId, active: true }, select: { id: true, name: true, role: true } }),
    prisma.loan.findMany({
      where: { companyId: user.companyId, status: "ACTIVE" },
      include: { client: { select: { name: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.loan.findMany({
      where: { companyId: user.companyId, createdAt: { gte: todayStart, lt: todayEnd } },
      include: { client: { select: { name: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.collection.findMany({
      where: { companyId: user.companyId, ...movementDateScope },
      include: { client: { select: { name: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.expense.findMany({
      where: { companyId: user.companyId, ...movementDateScope },
      include: { seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 25
    }),
    prisma.sale.findMany({
      where: { companyId: user.companyId, ...movementDateScope },
      include: { client: { select: { name: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 25
    }),
    prisma.cashbox.findMany({
      where: { companyId: user.companyId, date: { gte: todayStart, lt: todayEnd } },
      orderBy: { openedAt: "desc" }
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
  const dashboardCashbox: Cashbox = {
    id: cashboxesToday[0]?.id ?? "dashboard_cashbox",
    companyId: user.companyId,
    sellerId: user.id,
    date: todayStart.toISOString(),
    initialCash: sum(cashboxesToday.map((cashbox) => Number(cashbox.initialCash))),
    reportedCash: sum(cashboxesToday.map((cashbox) => Number(cashbox.reportedCash))),
    reportedTransfer: sum(cashboxesToday.map((cashbox) => Number(cashbox.reportedTransfer))),
    reportedPix: sum(cashboxesToday.map((cashbox) => Number(cashbox.reportedPix))),
    status: cashboxesToday.some((cashbox) => cashbox.status === "OPEN") ? "OPEN" : cashboxesToday[0]?.status ?? "OPEN",
    observations: ""
  };
  const dashboardSummary = calculateDailySummary({
    cashbox: dashboardCashbox,
    countryCode: company.countryCode,
    loans: loansToday.map((loan) => ({
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
    sales: salesToday.map((sale) => ({
      id: sale.id,
      companyId: sale.companyId,
      clientId: sale.clientId,
      sellerId: sale.sellerId,
      product: sale.concept,
      amount: Number(sale.amount),
      paymentMethod: sale.paymentMethod,
      date: sale.date.toISOString(),
      observation: sale.observation ?? undefined
    })) satisfies Sale[],
    collections: collectionsToday.map((collection) => ({
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
    })) satisfies Collection[],
    expenses: expensesToday.map((expense) => ({
      id: expense.id,
      companyId: expense.companyId,
      sellerId: expense.sellerId,
      movementKind: normalizeCashMovementKind(expense.movementKind),
      type: expense.type,
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      date: expense.date.toISOString(),
      comment: expense.comment ?? ""
    })) satisfies Expense[]
  });

  return {
    company: toCompany(company),
    metrics: {
      activeLoanBalance: loans.reduce((total, loan) => total + Number(loan.balance), 0),
      expectedToday: loans.reduce((total, loan) => total + Math.min(Number(loan.dailyPayment), Number(loan.balance)), 0),
      collectedToday: collectionsToday.reduce((total, collection) => total + Number(collection.amount), 0),
      loanDisbursementsToday: dashboardSummary.loanDisbursementsTotal,
      cashboxExpectedToday: dashboardSummary.expectedCash,
      cashInflowsToday: dashboardSummary.cashInflows,
      cashOutflowsToday: dashboardSummary.cashOutflows,
      expensesToday: expensesToday
        .filter((expense) => isCashMovementOutflow(normalizeCashMovementKind(expense.movementKind)))
        .reduce((total, expense) => total + Number(expense.amount), 0),
      overdueLoans: loans.filter((loan) => loan.dueDate < todayStart && Number(loan.balance) > 0).length,
      pendingClients: clients.filter((client) => client.status === "PENDING").length,
      activeSellers: users.filter((item) => item.role === "SELLER").length
    },
    sellerCollections: sellerCollections.length ? sellerCollections : [{ label: "Sin recaudos", value: 0 }],
    recentMovements: [
      ...loansToday.slice(0, 8).map((loan) => ({
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
        type: cashMovementKindLabels[normalizeCashMovementKind(expense.movementKind)],
        sellerName: expense.seller.name,
        paymentMethod: expense.paymentMethod,
        amount: getCashMovementImpact(Number(expense.amount), normalizeCashMovementKind(expense.movementKind))
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
