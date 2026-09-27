CREATE INDEX IF NOT EXISTS "Collection_loanId_idx"
ON "Collection"("loanId");

CREATE INDEX IF NOT EXISTS "Collection_loanId_date_idx"
ON "Collection"("loanId", "date");
