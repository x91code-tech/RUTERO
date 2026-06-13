CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'PAID', 'OVERDUE', 'CANCELLED');

CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "principalAmount" DECIMAL(12,2) NOT NULL,
    "interestRate" DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    "interestAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "dailyPayment" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL,
    "termDays" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Collection" ADD COLUMN "loanId" TEXT;

CREATE INDEX "Loan_companyId_status_idx" ON "Loan"("companyId", "status");
CREATE INDEX "Loan_clientId_status_idx" ON "Loan"("clientId", "status");
CREATE INDEX "Loan_sellerId_startDate_idx" ON "Loan"("sellerId", "startDate");
CREATE INDEX "Collection_loanId_idx" ON "Collection"("loanId");

ALTER TABLE "Loan" ADD CONSTRAINT "Loan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
