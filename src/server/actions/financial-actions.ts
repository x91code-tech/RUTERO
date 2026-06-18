"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PaymentMethod } from "@prisma/client";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { normalizeCashMovementKind } from "@/lib/cash-movements";
import { endOfLocalDay, parseDateInputAsLocal, startOfLocalDay } from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import { allocateLoanPayment, getGeneralBalanceAllocation } from "@/lib/loan-payments";
import { getSessionUser } from "@/lib/session";
import type { Cashbox, Collection, Expense, Sale } from "@/lib/types";
import { saleSchema, collectionSchema, expenseSchema, cashboxCloseSchema, loanSchema } from "@/lib/validations";
import { createNotification } from "@/server/services/notification-service";

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export async function createSaleAction(formData: FormData) {
  const payload = saleSchema.parse(Object.fromEntries(formData));
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const client = await prisma.client.findFirstOrThrow({
    where: {
      id: payload.clientId,
      companyId: user.companyId,
      ...(user.role === "SELLER" ? { sellerId: user.id } : {})
    }
  });
  const date = parseDateInputAsLocal(payload.date);

  await prisma.$transaction(async (tx) => {
    const createdSale = await tx.sale.create({
      data: {
        companyId: user.companyId,
        sellerId: user.id,
        clientId: client.id,
        concept: payload.product,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod as PaymentMethod,
        date,
        observation: payload.observation
      }
    });

    if (payload.paymentMethod === "CREDIT") {
      await tx.client.update({
        where: { id: client.id },
        data: {
          pendingBalance: {
            increment: payload.amount
          }
        }
      });
    }

    await tx.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: "SALE_CREATED",
        entity: "Sale",
        entityId: createdSale.id,
        newValue: payload
      }
    });

    return createdSale;
  });

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/cashbox");
  revalidatePath("/reports");
}

export async function createCollectionAction(formData: FormData) {
  const payload = collectionSchema.parse(Object.fromEntries(formData));
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const client = await prisma.client.findFirstOrThrow({
    where: {
      id: payload.clientId,
      companyId: user.companyId,
      ...(user.role === "SELLER" ? { sellerId: user.id } : {})
    }
  });
  const previousBalance = Number(client.pendingBalance);
  const date = parseDateInputAsLocal(payload.date);
  let paidLoanNotification: { balance: number } | null = null;

  await prisma.$transaction(async (tx) => {
    const activeLoan = payload.loanId
      ? await tx.loan.findFirstOrThrow({
          where: {
            id: payload.loanId,
            clientId: client.id,
            companyId: user.companyId,
            ...(user.role === "SELLER" ? { sellerId: user.id } : {}),
            status: "ACTIVE"
          }
        })
      : null;
    const allocation = activeLoan
      ? allocateLoanPayment({
          amount: payload.amount,
          application: payload.application,
          paymentType: payload.paymentType,
          loan: {
            balance: Number(activeLoan.balance),
            principalAmount: Number(activeLoan.principalAmount),
            interestAmount: Number(activeLoan.interestAmount),
            dailyPayment: Number(activeLoan.dailyPayment),
            termDays: activeLoan.termDays,
            principalBalance: Number(activeLoan.principalBalance),
            interestBalance: Number(activeLoan.interestBalance),
            lateFeeBalance: Number(activeLoan.lateFeeBalance),
            installmentsPaid: Number(activeLoan.installmentsPaid)
          }
        })
      : null;
    const generalAllocation = allocation
      ? null
      : getGeneralBalanceAllocation(payload.amount, previousBalance, payload.application);
    const receivedAmount = allocation?.receivedAmount ?? generalAllocation?.receivedAmount ?? payload.amount;
    const balanceApplied = allocation?.balanceApplied ?? generalAllocation?.balanceApplied ?? payload.amount;
    const newBalance = Math.max(previousBalance - balanceApplied, 0);

    const createdCollection = await tx.collection.create({
      data: {
        companyId: user.companyId,
        sellerId: user.id,
        clientId: client.id,
        loanId: activeLoan?.id,
        amount: receivedAmount,
        paymentType: payload.paymentType,
        application: payload.application,
        balanceApplied,
        principalApplied: allocation?.principalApplied ?? 0,
        interestApplied: allocation?.interestApplied ?? 0,
        lateFeeApplied: allocation?.lateFeeApplied ?? 0,
        additionalApplied: allocation?.additionalApplied ?? generalAllocation?.additionalApplied ?? 0,
        overpaymentAmount: allocation?.overpaymentAmount ?? generalAllocation?.overpaymentAmount ?? 0,
        installmentsCovered: allocation?.installmentsCovered ?? 0,
        previousBalance,
        newBalance,
        paymentMethod: payload.paymentMethod as PaymentMethod,
        date,
        observation: payload.observation
      }
    });

    if (activeLoan) {
      const loanBalance = allocation?.nextLoanBalance ?? Math.max(Number(activeLoan.balance) - balanceApplied, 0);
      const paidAmount = Number(activeLoan.paidAmount) + balanceApplied;

      await tx.loan.update({
        where: { id: activeLoan.id },
        data: {
          paidAmount,
          balance: loanBalance,
          principalBalance: allocation?.nextPrincipalBalance ?? Number(activeLoan.principalBalance),
          interestBalance: allocation?.nextInterestBalance ?? Number(activeLoan.interestBalance),
          lateFeeBalance: allocation?.nextLateFeeBalance ?? Number(activeLoan.lateFeeBalance),
          installmentsPaid: allocation?.nextInstallmentsPaid ?? Number(activeLoan.installmentsPaid),
          status: loanBalance <= 0 ? "PAID" : "ACTIVE"
        }
      });

      if (loanBalance <= 0) paidLoanNotification = { balance: loanBalance };
    }

    await tx.client.update({
      where: { id: client.id },
      data: {
        pendingBalance: newBalance
      }
    });

    await tx.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: "COLLECTION_CREATED",
        entity: "Collection",
        entityId: createdCollection.id,
        oldValue: { pendingBalance: previousBalance },
        newValue: {
          ...payload,
          amountReceived: receivedAmount,
          balanceApplied,
          pendingBalance: newBalance,
          principalApplied: allocation?.principalApplied ?? 0,
          interestApplied: allocation?.interestApplied ?? 0,
          lateFeeApplied: allocation?.lateFeeApplied ?? 0,
          overpaymentAmount: allocation?.overpaymentAmount ?? generalAllocation?.overpaymentAmount ?? 0
        }
      }
    });

    return createdCollection;
  });

  if (paidLoanNotification) {
    await createNotification({
      companyId: user.companyId,
      title: "Prestamo pagado",
      message: `${client.name} completo el pago de su prestamo.`,
      severity: "info"
    });
  }

  revalidatePath("/collections");
  revalidatePath("/loans");
  revalidatePath("/seller");
  revalidatePath("/cashbox");
  revalidatePath("/clients");
  revalidatePath(`/clients/${client.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function createLoanAction(formData: FormData) {
  const payload = loanSchema.parse(Object.fromEntries(formData));
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const client = await prisma.client.findFirstOrThrow({
    where: {
      id: payload.clientId,
      companyId: user.companyId,
      ...(user.role === "SELLER" ? { sellerId: user.id } : {})
    }
  });

  if (client.status !== "ACTIVE") redirect(`/clients/${client.id}?error=client_not_verified`);

  const startDate = parseDateInputAsLocal(payload.startDate);
  const dueDate = addDays(startDate, payload.termDays - 1);
  const principalAmount = payload.principalAmount;
  const interestRate = payload.interestRatePercent / 100;
  const sellerId = user.role === "SELLER" ? user.id : client.sellerId;
  const interestAmount = Number((principalAmount * interestRate).toFixed(2));
  const totalAmount = Number((principalAmount + interestAmount).toFixed(2));
  const dailyPayment = Number((totalAmount / payload.termDays).toFixed(2));

  await prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: {
        companyId: user.companyId,
        sellerId,
        clientId: client.id,
        principalAmount,
        interestRate,
        interestAmount,
        totalAmount,
        dailyPayment,
        balance: totalAmount,
        principalBalance: principalAmount,
        interestBalance: interestAmount,
        lateFeeBalance: 0,
        installmentsPaid: 0,
        termDays: payload.termDays,
        startDate,
        dueDate,
        notes: payload.notes
      }
    });

    await tx.client.update({
      where: { id: client.id },
      data: {
        pendingBalance: {
          increment: totalAmount
        }
      }
    });

    await tx.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: "LOAN_CREATED",
        entity: "Loan",
        entityId: loan.id,
        newValue: {
          ...payload,
          interestRate,
          interestAmount,
          totalAmount,
          dailyPayment
        }
      }
    });
  });

  await createNotification({
    companyId: user.companyId,
    title: "Prestamo creado",
    message: `${client.name} recibio un prestamo por ${principalAmount}. Total a cobrar: ${totalAmount}.`,
    severity: "info"
  });

  revalidatePath("/loans");
  revalidatePath("/clients");
  revalidatePath(`/clients/${client.id}`);
  revalidatePath("/collections");
  revalidatePath("/seller");
  revalidatePath("/dashboard");
  revalidatePath("/cashbox");
  revalidatePath("/reports");
}

export async function createExpenseAction(formData: FormData) {
  const payload = expenseSchema.parse(Object.fromEntries(formData));
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const date = parseDateInputAsLocal(payload.date);

  const expense = await prisma.expense.create({
    data: {
      companyId: user.companyId,
      sellerId: user.id,
      movementKind: payload.movementKind,
      type: payload.type,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod as PaymentMethod,
      date,
      comment: payload.comment
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      action: `${payload.movementKind}_CREATED`,
      entity: "Expense",
      entityId: expense.id,
      newValue: payload
    }
  });

  revalidatePath("/expenses");
  revalidatePath("/cashbox");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
}

async function getLastClosedCashboxBySeller(companyId: string, sellerIds: string[], beforeDate: Date) {
  if (!sellerIds.length) return new Map<string, { reportedCash: unknown }>();

  const previousCashboxes = await prisma.cashbox.findMany({
    where: {
      companyId,
      sellerId: { in: sellerIds },
      date: { lt: beforeDate },
      closedAt: { not: null }
    },
    orderBy: { date: "desc" }
  });
  const bySeller = new Map<string, { reportedCash: unknown }>();
  for (const cashbox of previousCashboxes) {
    if (!bySeller.has(cashbox.sellerId)) bySeller.set(cashbox.sellerId, cashbox);
  }
  return bySeller;
}

export async function openTodayCashboxesAction() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "SELLER") redirect("/cashbox");

  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const collectors = await prisma.user.findMany({
    where: { companyId: user.companyId, active: true, role: "SELLER" },
    select: { id: true, name: true }
  });
  const sellerIds = collectors.map((collector) => collector.id);
  const [existing, previousBySeller] = await Promise.all([
    prisma.cashbox.findMany({
      where: { companyId: user.companyId, sellerId: { in: sellerIds }, date: { gte: todayStart, lt: todayEnd } },
      select: { sellerId: true }
    }),
    getLastClosedCashboxBySeller(user.companyId, sellerIds, todayStart)
  ]);
  const openedSellerIds = new Set(existing.map((cashbox) => cashbox.sellerId));
  const missingCollectors = collectors.filter((collector) => !openedSellerIds.has(collector.id));

  await prisma.$transaction(async (tx) => {
    for (const collector of missingCollectors) {
      await tx.cashbox.create({
        data: {
          companyId: user.companyId,
          sellerId: collector.id,
          date: todayStart,
          initialCash: Number(previousBySeller.get(collector.id)?.reportedCash ?? 0),
          reportedCash: 0,
          reportedTransfer: 0,
          reportedPix: 0,
          expectedCash: Number(previousBySeller.get(collector.id)?.reportedCash ?? 0),
          difference: 0,
          status: "OPEN"
        }
      });
    }

    await tx.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: "CASHBOXES_OPENED",
        entity: "Cashbox",
        entityId: todayStart.toISOString(),
        newValue: {
          opened: missingCollectors.length,
          alreadyOpen: existing.length
        }
      }
    });
  });

  await createNotification({
    companyId: user.companyId,
    title: "Cajas abiertas",
    message: missingCollectors.length
      ? `${user.name} abrio ${missingCollectors.length} caja(s) para hoy.`
      : "Todas las cajas de hoy ya estaban abiertas.",
    severity: "info"
  });

  revalidatePath("/cashbox");
  revalidatePath("/dashboard");
}

export async function closeCashboxAction(formData: FormData) {
  const payload = cashboxCloseSchema.parse(Object.fromEntries(formData));
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "SELLER") redirect("/cashbox");

  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const sellerScope = { sellerId: user.id };
  const movementDateScope = { OR: [{ date: { gte: todayStart, lt: todayEnd } }, { createdAt: { gte: todayStart, lt: todayEnd } }] };
  const [sales, collections, expenses, loans] = await Promise.all([
    prisma.sale.findMany({ where: { companyId: user.companyId, ...sellerScope, ...movementDateScope } }),
    prisma.collection.findMany({ where: { companyId: user.companyId, ...sellerScope, ...movementDateScope } }),
    prisma.expense.findMany({ where: { companyId: user.companyId, ...sellerScope, ...movementDateScope } }),
    prisma.loan.findMany({ where: { companyId: user.companyId, ...sellerScope, createdAt: { gte: todayStart, lt: todayEnd } } })
  ]);
  const cashboxInput: Cashbox = {
    id: "cashbox_close",
    companyId: user.companyId,
    sellerId: user.id,
    date: todayStart.toISOString(),
    initialCash: payload.initialCash,
    reportedCash: payload.reportedCash,
    reportedTransfer: payload.reportedTransfer,
    reportedPix: payload.reportedPix,
    status: "OPEN",
    observations: payload.observations ?? ""
  };
  const summary = calculateDailySummary({
    cashbox: cashboxInput,
    sales: sales.map((sale) => ({
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
    collections: collections.map((collection) => ({
      id: collection.id,
      companyId: collection.companyId,
      clientId: collection.clientId,
      loanId: collection.loanId ?? undefined,
      sellerId: collection.sellerId,
      amount: Number(collection.amount),
      previousBalance: Number(collection.previousBalance),
      newBalance: Number(collection.newBalance),
      paymentMethod: collection.paymentMethod,
      date: collection.date.toISOString(),
      observation: collection.observation ?? undefined
    })) satisfies Collection[],
    expenses: expenses.map((expense) => ({
      id: expense.id,
      companyId: expense.companyId,
      sellerId: expense.sellerId,
      movementKind: normalizeCashMovementKind(expense.movementKind),
      type: expense.type as Expense["type"],
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      date: expense.date.toISOString(),
      comment: expense.comment ?? ""
    })) satisfies Expense[],
    loans: loans.map((loan) => ({
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
      termDays: loan.termDays,
      startDate: loan.startDate.toISOString(),
      dueDate: loan.dueDate.toISOString(),
      status: loan.status,
      notes: loan.notes ?? undefined
    }))
  });

  const status = summary.difference === 0 ? "BALANCED" : "UNBALANCED";
  const cashbox = await prisma.cashbox.upsert({
    where: {
      sellerId_date: {
        sellerId: user.id,
        date: todayStart
      }
    },
    update: {
      initialCash: payload.initialCash,
      reportedCash: payload.reportedCash,
      reportedTransfer: payload.reportedTransfer,
      reportedPix: payload.reportedPix,
      expectedCash: summary.expectedCash,
      difference: summary.difference,
      status,
      observations: payload.observations,
      closedAt: new Date()
    },
    create: {
      companyId: user.companyId,
      sellerId: user.id,
      date: todayStart,
      initialCash: payload.initialCash,
      reportedCash: payload.reportedCash,
      reportedTransfer: payload.reportedTransfer,
      reportedPix: payload.reportedPix,
      expectedCash: summary.expectedCash,
      difference: summary.difference,
      status,
      observations: payload.observations,
      closedAt: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      action: "CASHBOX_CLOSED",
      entity: "Cashbox",
      entityId: cashbox.id,
      newValue: { ...payload, expectedCash: summary.expectedCash, difference: summary.difference, status }
    }
  });

  await createNotification({
    companyId: user.companyId,
    title: summary.difference === 0 ? "Caja cerrada correctamente" : "Caja con diferencia",
    message: summary.difference === 0
      ? `${user.name} cerro caja sin diferencias.`
      : `${user.name} cerro caja con diferencia de ${summary.difference}.`,
    severity: summary.difference === 0 ? "info" : "critical"
  });

  revalidatePath("/cashbox");
  revalidatePath("/dashboard");
}
