"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { saleSchema, collectionSchema, expenseSchema, cashboxCloseSchema, loanSchema } from "@/lib/validations";

const LOAN_INTEREST_RATE = 0.2;

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
      companyId: user.companyId
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
      companyId: user.companyId
    }
  });
  const previousBalance = Number(client.pendingBalance);
  const newBalance = Math.max(previousBalance - payload.amount, 0);
  const date = payload.date ? new Date(payload.date) : new Date();

  await prisma.$transaction(async (tx) => {
    const activeLoan = payload.loanId
      ? await tx.loan.findFirstOrThrow({
          where: {
            id: payload.loanId,
            clientId: client.id,
            companyId: user.companyId,
            status: "ACTIVE"
          }
        })
      : null;

    const createdCollection = await tx.collection.create({
      data: {
        companyId: user.companyId,
        sellerId: user.id,
        clientId: client.id,
        loanId: activeLoan?.id,
        amount: payload.amount,
        previousBalance,
        newBalance,
        paymentMethod: payload.paymentMethod as PaymentMethod,
        date,
        observation: payload.observation
      }
    });

    if (activeLoan) {
      const loanBalance = Math.max(Number(activeLoan.balance) - payload.amount, 0);
      const paidAmount = Number(activeLoan.paidAmount) + payload.amount;

      await tx.loan.update({
        where: { id: activeLoan.id },
        data: {
          paidAmount,
          balance: loanBalance,
          status: loanBalance <= 0 ? "PAID" : "ACTIVE"
        }
      });
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
        newValue: { ...payload, pendingBalance: newBalance }
      }
    });

    return createdCollection;
  });

  revalidatePath("/collections");
  revalidatePath("/loans");
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
      companyId: user.companyId
    }
  });

  const startDate = payload.startDate ? new Date(payload.startDate) : new Date();
  const dueDate = addDays(startDate, payload.termDays - 1);
  const principalAmount = payload.principalAmount;
  const interestAmount = Number((principalAmount * LOAN_INTEREST_RATE).toFixed(2));
  const totalAmount = Number((principalAmount + interestAmount).toFixed(2));
  const dailyPayment = Number((totalAmount / payload.termDays).toFixed(2));

  await prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: {
        companyId: user.companyId,
        sellerId: user.id,
        clientId: client.id,
        principalAmount,
        interestRate: LOAN_INTEREST_RATE,
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
          interestRate: LOAN_INTEREST_RATE,
          interestAmount,
          totalAmount,
          dailyPayment
        }
      }
    });
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
  revalidatePath("/cashbox");
  void payload;
}
