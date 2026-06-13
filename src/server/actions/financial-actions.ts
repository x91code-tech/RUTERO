"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PaymentMethod } from "@prisma/client";
import { calculateDailySummary } from "@/lib/cashbox-calculations";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { Cashbox, Collection, Expense, Sale } from "@/lib/types";
import { saleSchema, collectionSchema, expenseSchema, cashboxCloseSchema, loanSchema } from "@/lib/validations";
import { createNotification } from "@/server/services/notification-service";

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
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
  const date = payload.date ? new Date(payload.date) : new Date();

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
  const date = payload.date ? new Date(payload.date) : new Date();
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
    const effectiveAmount = activeLoan ? Math.min(payload.amount, Number(activeLoan.balance)) : payload.amount;
    const newBalance = Math.max(previousBalance - effectiveAmount, 0);

    const createdCollection = await tx.collection.create({
      data: {
        companyId: user.companyId,
        sellerId: user.id,
        clientId: client.id,
        loanId: activeLoan?.id,
        amount: effectiveAmount,
        previousBalance,
        newBalance,
        paymentMethod: payload.paymentMethod as PaymentMethod,
        date,
        observation: payload.observation
      }
    });

    if (activeLoan) {
      const loanBalance = Math.max(Number(activeLoan.balance) - effectiveAmount, 0);
      const paidAmount = Number(activeLoan.paidAmount) + effectiveAmount;

      await tx.loan.update({
        where: { id: activeLoan.id },
        data: {
          paidAmount,
          balance: loanBalance,
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
        newValue: { ...payload, amount: effectiveAmount, pendingBalance: newBalance }
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
  revalidatePath("/cashbox");
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

  const startDate = payload.startDate ? new Date(payload.startDate) : new Date();
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
  revalidatePath("/dashboard");
}

export async function createExpenseAction(formData: FormData) {
  const payload = expenseSchema.parse(Object.fromEntries(formData));
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const date = payload.date ? new Date(payload.date) : new Date();

  const expense = await prisma.expense.create({
    data: {
      companyId: user.companyId,
      sellerId: user.id,
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
      action: "EXPENSE_CREATED",
      entity: "Expense",
      entityId: expense.id,
      newValue: payload
    }
  });

  revalidatePath("/expenses");
  revalidatePath("/cashbox");
}

export async function closeCashboxAction(formData: FormData) {
  const payload = cashboxCloseSchema.parse(Object.fromEntries(formData));
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  const [sales, collections, expenses, loans] = await Promise.all([
    prisma.sale.findMany({ where: { companyId: user.companyId, sellerId: user.id, date: { gte: todayStart, lt: todayEnd } } }),
    prisma.collection.findMany({ where: { companyId: user.companyId, sellerId: user.id, date: { gte: todayStart, lt: todayEnd } } }),
    prisma.expense.findMany({ where: { companyId: user.companyId, sellerId: user.id, date: { gte: todayStart, lt: todayEnd } } }),
    prisma.loan.findMany({ where: { companyId: user.companyId, sellerId: user.id, createdAt: { gte: todayStart, lt: todayEnd } } })
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
