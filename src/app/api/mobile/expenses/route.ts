import type { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrencyConfig } from "@/lib/countries";
import { endOfLocalDay, parseDateInputAsLocal, startOfLocalDay } from "@/lib/date-utils";
import { prisma } from "@/lib/db";
import { mobileError, mobileOk, requireMobileUser } from "@/lib/mobile-api";
import { expenseSchema } from "@/lib/validations";

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
  if (user.role !== "SELLER") return mobileError("Solo el cobrador puede registrar movimientos desde la app movil.", 403);
  if (!await ensureOpenCashbox(user)) return mobileError("La caja de hoy no esta abierta.", 409);

  const parsed = expenseSchema.safeParse(await readJson(request));
  if (!parsed.success) return mobileError("Revisa los datos del movimiento.", 422);
  const payload = parsed.data;
  const currency = getCurrencyConfig({ countryCode: user.countryCode });

  const expense = await prisma.expense.create({
    data: {
      companyId: user.companyId,
      sellerId: user.id,
      countryCode: user.countryCode,
      currencyCode: currency.currencyCode,
      movementKind: payload.movementKind,
      type: payload.type,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod as PaymentMethod,
      date: parseDateInputAsLocal(payload.date),
      comment: payload.comment
    }
  });

  await prisma.auditLog.create({
    data: {
      companyId: user.companyId,
      userId: user.id,
      action: `MOBILE_${payload.movementKind}_CREATED`,
      entity: "Expense",
      entityId: expense.id,
      newValue: payload
    }
  });

  return mobileOk({
    expense: {
      id: expense.id,
      movementKind: expense.movementKind,
      type: expense.type,
      amount: Number(expense.amount),
      paymentMethod: expense.paymentMethod,
      date: expense.date.toISOString(),
      comment: expense.comment
    }
  });
}
