CREATE UNIQUE INDEX "PlatformPayment_companyId_transactionRef_key"
ON "PlatformPayment"("companyId", "transactionRef");
