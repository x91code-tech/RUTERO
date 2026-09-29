import type { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import { endOfLocalDay, parseDateInputAsLocal, startOfLocalDay } from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import { allocateLoanPayment, getGeneralBalanceAllocation } from "@/lib/loan-payments";
import { mobileError, mobileOk, requireMobileUser } from "@/lib/mobile-api";
import { collectionSchema } from "@/lib/validations";
import { createNotification } from "@/server/services/notification-service";

export const dynamic = "force-dynamic";

async function readJson(request: Request) {
  return request.headers.get("content-type")?.includes("application/json")
    ? await request.json()
    : Object.fromEntries(await request.formData());
}

async function ensureOpenCashbox(user: { id: string; companyId: string }) {
  const todayStart = startOfLocalDay();
  const todayEnd = endOfLocalDay();
  return prisma.cashbox.findFirst({
    where: { companyId: user.companyId, sellerId: user.id, date: { gte: todayStart, lt: todayEnd }, status: "OPEN" },
    select: { id: true }
  });
}

export async function POST(request: Request) {
  const user = await requireMobileUser(request);
  if (user instanceof NextResponse) return user;
  if (user.role !== "SELLER") return mobileError("Solo el cobrador puede registrar recaudos desde la app movil.", 403);
  if (!await ensureOpenCashbox(user)) return mobileError("La caja de hoy no esta abierta.", 409);

  const parsed = collectionSchema.safeParse(await readJson(request));
  if (!parsed.success) return mobileError("Revisa los datos del recaudo.", 422);
  const payload = parsed.data;

  const client = await prisma.client.findFirst({
    where: { id: payload.clientId, companyId: user.companyId, sellerId: user.id }
  });
  if (!client) return mobileError("Cliente no encontrado.", 404);

  const companySettings = await prisma.company.findUniqueOrThrow({
    where: { id: user.companyId },
    select: { paymentAllocationOrder: true, renewalPolicy: true }
  });
  const previousBalance = Number(client.pendingBalance);
  const date = parseDateInputAsLocal(payload.date);
  const activeLoan = payload.loanId
    ? await prisma.loan.findFirst({
        where: { id: payload.loanId, clientId: client.id, companyId: user.companyId, sellerId: user.id, status: "ACTIVE" }
      })
    : null;

  if (payload.loanId && !activeLoan) return mobileError("Prestamo activo no encontrado.", 404);

  const allocation = activeLoan
    ? allocateLoanPayment({
        amount: payload.amount,
        application: payload.application,
        paymentType: payload.paymentType,
        allocationOrder: companySettings.paymentAllocationOrder,
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
  const generalAllocation = allocation ? null : getGeneralBalanceAllocation(payload.amount, previousBalance, payload.application);
  const receivedAmount = allocation?.receivedAmount ?? generalAllocation?.receivedAmount ?? payload.amount;
  const balanceApplied = allocation?.balanceApplied ?? generalAllocation?.balanceApplied ?? payload.amount;
  const newBalance = Math.max(previousBalance - balanceApplied, 0);

  if (
    activeLoan &&
    payload.paymentType === "RENEWAL" &&
    companySettings.renewalPolicy !== "ALLOW_BALANCE" &&
    (allocation?.nextLoanBalance ?? Number(activeLoan.balance)) > 0
  ) {
    return mobileError("Para renovar, primero debe pagar el saldo completo.", 409);
  }

  let paidLoan = false;
  const collection = await prisma.$transaction(async (tx) => {
    const created = await tx.collection.create({
      data: {
        companyId: user.companyId,
        sellerId: user.id,
        clientId: client.id,
        loanId: activeLoan?.id,
        countryCode: client.countryCode,
        currencyCode: client.currencyCode,
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
      paidLoan = loanBalance <= 0;
      await tx.loan.update({
        where: { id: activeLoan.id },
        data: {
          paidAmount: Number(activeLoan.paidAmount) + balanceApplied,
          balance: loanBalance,
          principalBalance: allocation?.nextPrincipalBalance ?? Number(activeLoan.principalBalance),
          interestBalance: allocation?.nextInterestBalance ?? Number(activeLoan.interestBalance),
          lateFeeBalance: allocation?.nextLateFeeBalance ?? Number(activeLoan.lateFeeBalance),
          installmentsPaid: allocation?.nextInstallmentsPaid ?? Number(activeLoan.installmentsPaid),
          status: paidLoan ? "PAID" : "ACTIVE"
        }
      });
    }

    await tx.client.update({ where: { id: client.id }, data: { pendingBalance: newBalance } });
    await tx.auditLog.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        action: "MOBILE_COLLECTION_CREATED",
        entity: "Collection",
        entityId: created.id,
        oldValue: { pendingBalance: previousBalance },
        newValue: { ...payload, amountReceived: receivedAmount, balanceApplied, pendingBalance: newBalance }
      }
    });
    return created;
  });

  if (paidLoan) {
    await createNotification({
      companyId: user.companyId,
      title: "Prestamo pagado",
      message: `${client.name} completo el pago de su prestamo.`,
      severity: "info"
    });
  }

  return mobileOk({
    collection: {
      id: collection.id,
      amount: Number(collection.amount),
      balanceApplied: Number(collection.balanceApplied),
      previousBalance: Number(collection.previousBalance),
      newBalance: Number(collection.newBalance),
      paymentMethod: collection.paymentMethod,
      date: collection.date.toISOString()
    }
  });
}
