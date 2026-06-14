-- Add mobile/PIN login for collectors without changing web email/password auth.
ALTER TABLE "User" ADD COLUMN "mobileIdentifier" TEXT;
ALTER TABLE "User" ADD COLUMN "mobilePinHash" TEXT;
ALTER TABLE "User" ADD COLUMN "mobilePinUpdatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_mobileIdentifier_key" ON "User"("mobileIdentifier");
