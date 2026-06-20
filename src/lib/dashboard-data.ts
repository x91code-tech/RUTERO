import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { cashMovementKindLabels, getCashMovementImpact, isCashMovementOutflow, normalizeCashMovementKind } from "@/lib/cash-movements";
import { demoCashbox, demoClients, demoCollections, demoCompany, demoExpenses, demoLoans, demoNotifications, demoSales, demoUsers } from "@/lib/demo-data";
import { endOfLocalDay, startOfLocalDay } from "@/lib/date-utils";
import { paymentMethodLabel } from "@/lib/formatters";
import { shouldCollectOnDate } from "@/lib/loan-schedule";
import type { AdminAnalyticsData } from "@/components/charts/admin-analytics";
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

type Summary = ReturnType<typeof calculateDailySummary>;

function buildCashFlowAnalytics(summary: Summary) {
  return [
    { label: "Ventas", entrada: summary.cashSales, salida: 0 },
    { label: "Recaudos", entrada: summary.cashCollections, salida: 0 },
    { label: "Entradas", entrada: summary.cashIncomeMovements, salida: 0 },
    { label: "Prestamos", entrada: 0, salida: summary.loanDisbursementsTotal },
    { label: "Gastos", entrada: 0, salida: summary.cashExpenses },
    { label: "Retiros", entrada: 0, salida: summary.cashWithdrawals }
  ];
}

function buildPortfolioAnalytics(loans: { balance: unknown; principalBalance?: unknown; interestBalance?: unknown; lateFeeBalance?: unknown; interestAmount?: unknown }[]) {
  const principal = sum(loans.map((loan) => {
    const principalBalance = Number(loan.principalBalance ?? 0);
    if (principalBalance > 0) return principalBalance;
    const balance = Number(loan.balance ?? 0);
    const interest = Math.min(Number(loan.interestAmount ?? 0), balance);
    return Math.max(balance - interest, 0);
  }));
  const interest = sum(loans.map((loan) => {
    const interestBalance = Number(loan.interestBalance ?? 0);
    if (interestBalance > 0) return interestBalance;
    return Math.min(Number(loan.interestAmount ?? 0), Number(loan.balance ?? 0));
  }));
  const lateFee = sum(loans.map((loan) => Number(loan.lateFeeBalance ?? 0)));
  const rows = [
    { label: "Capital pendiente", value: principal },
    { label: "Interes pendiente", value: interest },
    { label: "Mora pendiente", value: lateFee }
  ].filter((row) => row.value > 0);

  return rows.length ? rows : [{ label: "Sin cartera activa", value: 0 }];
}

function buildClientStatusAnalytics(clients: { status: string }[]) {
  const labels: Record<string, string> = {
    ACTIVE: "Activos",
    PENDING: "Por verificar",
    DELINQUENT: "En atraso",
    INACTIVE: "Inactivos"
  };
  const rows = Object.entries(labels).map(([status, label]) => ({
    label,
    value: clients.filter((client) => client.status === status).length
  }));

  return rows.some((row) => row.value > 0) ? rows : [{ label: "Sin clientes", value: 0 }];
}

function buildPaymentMethodAnalytics(records: { paymentMethod: string; amount: unknown }[], countryCode: string) {
  const totals = new Map<string, number>();
  for (const record of records) {
    totals.set(record.paymentMethod, (totals.get(record.paymentMethod) ?? 0) + Number(record.amount ?? 0));
  }
  const rows = Array.from(totals.entries())
    .map(([method, value]) => ({ label: paymentMethodLabel(method, countryCode), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return rows.length ? rows : [{ label: "Sin pagos", value: 0 }];
}

function fallbackCollectorRows(rows: AdminAnalyticsData["collectors"]) {
  return rows.some((row) => row.esperado > 0 || row.cobrado > 0 || row.entregado > 0)
    ? rows
    : [{ label: "Sin actividad", esperado: 0, cobrado: 0, entregado: 0 }];
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
    const demoCollectors = fallbackCollectorRows(
      demoUsers
        .filter((item) => item.role === "SELLER" || item.role === "SUPERVISOR")
        .map((seller) => ({
          label: seller.name,
          esperado: activeLoans
            .filter((loan) => loan.sellerId === seller.id)
            .filter((loan) => shouldCollectOnDate({ startDate: loan.startDate, frequency: loan.paymentFrequency }))
            .reduce((total, loan) => total + Math.min(loan.dailyPayment, loan.balance), 0),
          cobrado: demoCollections
            .filter((collection) => collection.sellerId === seller.id)
            .reduce((total, collection) => total + collection.amount, 0),
          entregado: demoLoans
            .filter((loan) => loan.sellerId === seller.id)
            .reduce((total, loan) => total + loan.principalAmount, 0)
        }))
    );
    const demoAnalytics = {
      cashFlow: buildCashFlowAnalytics(demoSummary),
      portfolio: buildPortfolioAnalytics(activeLoans),
      collectors: demoCollectors,
      paymentMethods: buildPaymentMethodAnalytics([
        ...demoSales.map((sale) => ({ paymentMethod: sale.paymentMethod, amount: sale.amount })),
        ...demoCollections.map((collection) => ({ paymentMethod: collection.paymentMethod, amount: collection.amount })),
        ...demoExpenses
          .filter((expense) => normalizeCashMovementKind(expense.movementKind) === "INCOME")
          .map((expense) => ({ paymentMethod: expense.paymentMethod, amount: expense.amount }))
      ], demoCompany.countryCode),
      clientStatus: buildClientStatusAnalytics(demoClients)
    } satisfies AdminAnalyticsData;

    return {
      company: demoCompany,
      metrics: {
        activeLoanBalance: activeLoans.reduce((total, loan) => total + loan.balance, 0),
        expectedToday: activeLoans
          .filter((loan) => shouldCollectOnDate({ startDate: loan.startDate, frequency: loan.paymentFrequency }))
          .reduce((total, loan) => total + Math.min(loan.dailyPayment, loan.balance), 0),
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
      notifications: demoNotifications,
      analytics: demoAnalytics
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
      paymentFrequency: loan.paymentFrequency,
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
  const collectorAnalytics = fallbackCollectorRows(
    users
      .filter((item) => item.role === "SELLER" || item.role === "SUPERVISOR")
      .map((seller) => ({
        label: seller.name,
        esperado: loans
          .filter((loan) => loan.sellerId === seller.id)
          .filter((loan) => shouldCollectOnDate({ startDate: loan.startDate, targetDate: todayStart, frequency: loan.paymentFrequency }))
          .reduce((total, loan) => total + Math.min(Number(loan.dailyPayment), Number(loan.balance)), 0),
        cobrado: collectionsToday
          .filter((collection) => collection.sellerId === seller.id)
          .reduce((total, collection) => total + Number(collection.amount), 0),
        entregado: loansToday
          .filter((loan) => loan.sellerId === seller.id)
          .reduce((total, loan) => total + Number(loan.principalAmount), 0)
      }))
  );
  const analytics = {
    cashFlow: buildCashFlowAnalytics(dashboardSummary),
    portfolio: buildPortfolioAnalytics(loans),
    collectors: collectorAnalytics,
    paymentMethods: buildPaymentMethodAnalytics([
      ...salesToday.map((sale) => ({ paymentMethod: sale.paymentMethod, amount: sale.amount })),
      ...collectionsToday.map((collection) => ({ paymentMethod: collection.paymentMethod, amount: collection.amount })),
      ...expensesToday
        .filter((expense) => normalizeCashMovementKind(expense.movementKind) === "INCOME")
        .map((expense) => ({ paymentMethod: expense.paymentMethod, amount: expense.amount }))
    ], company.countryCode),
    clientStatus: buildClientStatusAnalytics(clients)
  } satisfies AdminAnalyticsData;

  return {
    company: toCompany(company),
    metrics: {
      activeLoanBalance: loans.reduce((total, loan) => total + Number(loan.balance), 0),
      expectedToday: loans
        .filter((loan) => shouldCollectOnDate({ startDate: loan.startDate, targetDate: todayStart, frequency: loan.paymentFrequency }))
        .reduce((total, loan) => total + Math.min(Number(loan.dailyPayment), Number(loan.balance)), 0),
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
    }))],
    analytics
  };
}
