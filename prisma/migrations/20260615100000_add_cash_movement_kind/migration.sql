ALTER TABLE "Expense" ADD COLUMN "movementKind" TEXT NOT NULL DEFAULT 'EXPENSE';

DROP INDEX IF EXISTS "Expense_companyId_sellerId_type_date_amount_key";

CREATE INDEX "Expense_companyId_movementKind_date_idx" ON "Expense"("companyId", "movementKind", "date");
