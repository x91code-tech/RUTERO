import type { CollectionApplication, CollectionPaymentType } from "@/lib/types";

type LoanPaymentInput = {
  amount: number;
  application: CollectionApplication;
  paymentType: CollectionPaymentType;
  loan: {
    balance: number;
    principalAmount: number;
    interestAmount: number;
    dailyPayment: number;
    termDays: number;
    principalBalance?: number;
    interestBalance?: number;
    lateFeeBalance?: number;
    installmentsPaid?: number;
  };
};

export type LoanPaymentAllocation = {
  receivedAmount: number;
  balanceApplied: number;
  principalApplied: number;
  interestApplied: number;
  lateFeeApplied: number;
  additionalApplied: number;
  overpaymentAmount: number;
  installmentsCovered: number;
  nextPrincipalBalance: number;
  nextInterestBalance: number;
  nextLateFeeBalance: number;
  nextInstallmentsPaid: number;
  nextLoanBalance: number;
};

export function allocateLoanPayment(input: LoanPaymentInput): LoanPaymentAllocation {
  const amount = money(input.amount);
  const noBalanceImpact = input.application === "ADDITIONAL_NO_BALANCE";
  const balances = getComponentBalances(input.loan);

  if (noBalanceImpact) {
    return {
      receivedAmount: amount,
      balanceApplied: 0,
      principalApplied: 0,
      interestApplied: 0,
      lateFeeApplied: 0,
      additionalApplied: amount,
      overpaymentAmount: 0,
      installmentsCovered: 0,
      nextPrincipalBalance: balances.principal,
      nextInterestBalance: balances.interest,
      nextLateFeeBalance: balances.lateFee,
      nextInstallmentsPaid: input.loan.installmentsPaid ?? 0,
      nextLoanBalance: money(input.loan.balance)
    };
  }

  const order = getApplicationOrder(input.application);
  const remaining = { ...balances };
  const applied = { principal: 0, interest: 0, lateFee: 0 };
  let amountLeft = amount;

  for (const bucket of order) {
    const appliedToBucket = Math.min(amountLeft, remaining[bucket]);
    applied[bucket] = money(applied[bucket] + appliedToBucket);
    remaining[bucket] = money(remaining[bucket] - appliedToBucket);
    amountLeft = money(amountLeft - appliedToBucket);
    if (amountLeft <= 0) break;
  }

  const balanceApplied = money(applied.principal + applied.interest + applied.lateFee);
  const overpaymentAmount = money(Math.max(amount - balanceApplied, 0));
  const installmentsCovered = input.loan.dailyPayment > 0 ? money(balanceApplied / input.loan.dailyPayment) : 0;
  const maxInstallments = Math.max(input.loan.termDays - (input.loan.installmentsPaid ?? 0), 0);
  const nextInstallmentsPaid = money((input.loan.installmentsPaid ?? 0) + Math.min(installmentsCovered, maxInstallments));
  const nextLoanBalance = money(Math.max(input.loan.balance - balanceApplied, 0));

  return {
    receivedAmount: amount,
    balanceApplied,
    principalApplied: applied.principal,
    interestApplied: applied.interest,
    lateFeeApplied: applied.lateFee,
    additionalApplied: input.application === "ADDITIONAL_WITH_BALANCE" ? balanceApplied : 0,
    overpaymentAmount,
    installmentsCovered,
    nextPrincipalBalance: remaining.principal,
    nextInterestBalance: remaining.interest,
    nextLateFeeBalance: remaining.lateFee,
    nextInstallmentsPaid,
    nextLoanBalance
  };
}

export function getGeneralBalanceAllocation(amount: number, balance: number, application: CollectionApplication) {
  const receivedAmount = money(amount);
  const balanceApplied = application === "ADDITIONAL_NO_BALANCE" ? 0 : money(Math.min(receivedAmount, Math.max(balance, 0)));

  return {
    receivedAmount,
    balanceApplied,
    overpaymentAmount: money(Math.max(receivedAmount - balanceApplied, 0)),
    additionalApplied: application === "ADDITIONAL_NO_BALANCE" || application === "ADDITIONAL_WITH_BALANCE" ? receivedAmount : 0
  };
}

function getComponentBalances(loan: LoanPaymentInput["loan"]) {
  const principal = money(loan.principalBalance ?? 0);
  const interest = money(loan.interestBalance ?? 0);
  const lateFee = money(loan.lateFeeBalance ?? 0);
  const componentTotal = money(principal + interest + lateFee);

  if (componentTotal > 0) return { principal, interest, lateFee };

  const loanBalance = money(loan.balance);
  const fallbackInterest = Math.min(money(loan.interestAmount), loanBalance);
  return {
    principal: money(Math.max(loanBalance - fallbackInterest, 0)),
    interest: money(fallbackInterest),
    lateFee: 0
  };
}

function getApplicationOrder(application: CollectionApplication): Array<"lateFee" | "interest" | "principal"> {
  if (application === "CAPITAL_ONLY") return ["principal"];
  if (application === "INTEREST_ONLY") return ["interest"];
  if (application === "LATE_FEE") return ["lateFee"];
  if (application === "CAPITAL_INTEREST") return ["interest", "principal"];
  return ["lateFee", "interest", "principal"];
}

function money(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}
