ALTER TABLE "PartnerCommission"
ADD COLUMN "payoutRecordedById" TEXT;

ALTER TABLE "PartnerCommission"
ADD CONSTRAINT "PartnerCommission_payoutRecordedById_fkey"
FOREIGN KEY ("payoutRecordedById") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "PartnerCommission_payoutRecordedById_idx"
ON "PartnerCommission"("payoutRecordedById");
