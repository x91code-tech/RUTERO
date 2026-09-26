ALTER TABLE "User" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'VE';
ALTER TABLE "Client" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'VE';
ALTER TABLE "Client" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'VES';

ALTER TABLE "Loan" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'VE';
ALTER TABLE "Loan" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'VES';
ALTER TABLE "Sale" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'VE';
ALTER TABLE "Sale" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'VES';
ALTER TABLE "Collection" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'VE';
ALTER TABLE "Collection" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'VES';
ALTER TABLE "Expense" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'VE';
ALTER TABLE "Expense" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'VES';
ALTER TABLE "Cashbox" ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'VE';
ALTER TABLE "Cashbox" ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'VES';

DROP INDEX "Client_companyId_document_key";
CREATE UNIQUE INDEX "Client_companyId_countryCode_document_key" ON "Client"("companyId", "countryCode", "document");

UPDATE "User" AS target
SET "countryCode" = company."countryCode"
FROM "Company" AS company
WHERE target."companyId" = company."id";

UPDATE "Client" AS target
SET "countryCode" = company."countryCode",
    "currencyCode" = company."currencyCode"
FROM "Company" AS company
WHERE target."companyId" = company."id";

UPDATE "Loan" AS target
SET "countryCode" = client."countryCode",
    "currencyCode" = client."currencyCode"
FROM "Client" AS client
WHERE target."clientId" = client."id";

UPDATE "Sale" AS target
SET "countryCode" = client."countryCode",
    "currencyCode" = client."currencyCode"
FROM "Client" AS client
WHERE target."clientId" = client."id";

UPDATE "Collection" AS target
SET "countryCode" = client."countryCode",
    "currencyCode" = client."currencyCode"
FROM "Client" AS client
WHERE target."clientId" = client."id";

UPDATE "Expense" AS target
SET "countryCode" = company."countryCode",
    "currencyCode" = company."currencyCode"
FROM "Company" AS company
WHERE target."companyId" = company."id";

UPDATE "Cashbox" AS target
SET "countryCode" = company."countryCode",
    "currencyCode" = company."currencyCode"
FROM "Company" AS company
WHERE target."companyId" = company."id";
