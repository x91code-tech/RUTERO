import type { PaymentFrequency } from "@/lib/types";

export function addPaymentPeriods(date: Date, periods: number, frequency: PaymentFrequency = "DAILY") {
  const nextDate = new Date(date);
  if (frequency === "WEEKLY") nextDate.setDate(nextDate.getDate() + periods * 7);
  else if (frequency === "BIWEEKLY") nextDate.setDate(nextDate.getDate() + periods * 14);
  else if (frequency === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + periods);
  else nextDate.setDate(nextDate.getDate() + periods);
  return nextDate;
}

export function shouldCollectOnDate(input: { startDate: string | Date; targetDate?: string | Date; frequency?: PaymentFrequency }) {
  const startDate = startOfDay(input.startDate);
  const targetDate = startOfDay(input.targetDate ?? new Date());
  if (targetDate < startDate) return false;

  const frequency = input.frequency ?? "DAILY";
  if (frequency === "DAILY") return true;
  if (frequency === "MONTHLY") return targetDate.getDate() === startDate.getDate();

  const elapsedDays = Math.floor((targetDate.getTime() - startDate.getTime()) / 86400000);
  if (frequency === "WEEKLY") return elapsedDays % 7 === 0;
  if (frequency === "BIWEEKLY") return elapsedDays % 14 === 0;
  return true;
}

export function getInstallmentNumber(input: {
  startDate: string | Date;
  targetDate?: string | Date;
  frequency?: PaymentFrequency;
  termDays: number;
}) {
  const startDate = startOfDay(input.startDate);
  const targetDate = startOfDay(input.targetDate ?? new Date());
  if (targetDate < startDate) return 1;

  const frequency = input.frequency ?? "DAILY";
  const elapsedDays = Math.floor((targetDate.getTime() - startDate.getTime()) / 86400000);
  let installmentNumber = elapsedDays + 1;

  if (frequency === "WEEKLY") installmentNumber = Math.floor(elapsedDays / 7) + 1;
  if (frequency === "BIWEEKLY") installmentNumber = Math.floor(elapsedDays / 14) + 1;
  if (frequency === "MONTHLY") {
    installmentNumber = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + targetDate.getMonth() - startDate.getMonth() + 1;
  }

  return Math.min(Math.max(installmentNumber, 1), input.termDays);
}

function startOfDay(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}
