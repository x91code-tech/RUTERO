CREATE TYPE "CollectionPaymentType" AS ENUM ('INSTALLMENT', 'ADVANCE', 'SETTLEMENT', 'MANUAL', 'RENEWAL', 'ADDITIONAL');

CREATE TYPE "CollectionApplication" AS ENUM ('NORMAL', 'CAPITAL_INTEREST', 'CAPITAL_ONLY', 'INTEREST_ONLY', 'LATE_FEE', 'ADDITIONAL_WITH_BALANCE', 'ADDITIONAL_NO_BALANCE');

ALTER TABLE "Loan"
ADD COLUMN "principalBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "interestBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "lateFeeBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "installmentsPaid" DECIMAL(8,2) NOT NULL DEFAULT 0;

UPDATE "Loan"
SET
  "interestBalance" = LEAST("interestAmount", "balance"),
  "principalBalance" = GREATEST("balance" - LEAST("interestAmount", "balance"), 0),
  "lateFeeBalance" = 0,
  "installmentsPaid" = CASE
    WHEN "dailyPayment" > 0 THEN LEAST("paidAmount" / "dailyPayment", "termDays")
    ELSE 0
  END;

ALTER TABLE "Collection"
ADD COLUMN "paymentType" "CollectionPaymentType" NOT NULL DEFAULT 'INSTALLMENT',
ADD COLUMN "application" "CollectionApplication" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "balanceApplied" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "principalApplied" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "interestApplied" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "lateFeeApplied" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "additionalApplied" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "overpaymentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "installmentsCovered" DECIMAL(8,2) NOT NULL DEFAULT 0;

UPDATE "Collection"
SET
  "balanceApplied" = LEAST("amount", "previousBalance"),
  "overpaymentAmount" = GREATEST("amount" - LEAST("amount", "previousBalance"), 0);

CREATE INDEX "Collection_loanId_date_idx" ON "Collection"("loanId", "date");
