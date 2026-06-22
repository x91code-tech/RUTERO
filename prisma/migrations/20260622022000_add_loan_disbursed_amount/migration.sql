ALTER TABLE "Loan" ADD COLUMN "disbursedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

UPDATE "Loan" SET "disbursedAmount" = "principalAmount" WHERE "disbursedAmount" = 0;
