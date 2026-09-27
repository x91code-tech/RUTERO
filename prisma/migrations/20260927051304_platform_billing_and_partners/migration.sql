-- CreateEnum
CREATE TYPE "CompanyAccountType" AS ENUM ('CUSTOMER', 'PARTNER');

-- CreateEnum
CREATE TYPE "PlatformPlanType" AS ENUM ('INDIVIDUAL', 'BUSINESS', 'PARTNER');

-- CreateEnum
CREATE TYPE "PartnerCommissionStatus" AS ENUM ('PENDING', 'PAID');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PARTNER';

-- DropIndex
DROP INDEX "Collection_loanId_date_idx";

-- DropIndex
DROP INDEX "Collection_loanId_idx";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "accountType" "CompanyAccountType" NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN     "referredByPartnerId" TEXT;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "billingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "billingCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "planType" "PlatformPlanType" NOT NULL DEFAULT 'BUSINESS',
ADD COLUMN     "platformPlanId" TEXT;

-- CreateTable
CREATE TABLE "PlatformPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlatformPlanType" NOT NULL,
    "monthlyPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "maxSellers" INTEGER NOT NULL DEFAULT 5,
    "maxCompanies" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxCompanies" INTEGER NOT NULL DEFAULT 5,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformPayment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionRef" TEXT NOT NULL,
    "periodMonths" INTEGER NOT NULL DEFAULT 1,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerCommission" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL,
    "status" "PartnerCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "payoutReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformPlan_name_key" ON "PlatformPlan"("name");

-- CreateIndex
CREATE INDEX "PlatformPlan_type_active_idx" ON "PlatformPlan"("type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerProfile_userId_key" ON "PartnerProfile"("userId");

-- CreateIndex
CREATE INDEX "PlatformPayment_companyId_receivedAt_idx" ON "PlatformPayment"("companyId", "receivedAt");

-- CreateIndex
CREATE INDEX "PlatformPayment_subscriptionId_receivedAt_idx" ON "PlatformPayment"("subscriptionId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerCommission_paymentId_key" ON "PartnerCommission"("paymentId");

-- CreateIndex
CREATE INDEX "PartnerCommission_partnerId_status_currencyCode_idx" ON "PartnerCommission"("partnerId", "status", "currencyCode");

-- CreateIndex
CREATE INDEX "Company_accountType_referredByPartnerId_idx" ON "Company"("accountType", "referredByPartnerId");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_planType_active_renewsAt_idx" ON "SubscriptionPlan"("planType", "active", "renewsAt");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_referredByPartnerId_fkey" FOREIGN KEY ("referredByPartnerId") REFERENCES "PartnerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT "SubscriptionPlan_platformPlanId_fkey" FOREIGN KEY ("platformPlanId") REFERENCES "PlatformPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerProfile" ADD CONSTRAINT "PartnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPayment" ADD CONSTRAINT "PlatformPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPayment" ADD CONSTRAINT "PlatformPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPayment" ADD CONSTRAINT "PlatformPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerCommission" ADD CONSTRAINT "PartnerCommission_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "PartnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerCommission" ADD CONSTRAINT "PartnerCommission_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PlatformPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
