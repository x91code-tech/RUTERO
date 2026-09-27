ALTER TABLE "SubscriptionPlan"
ALTER COLUMN "billingAmount" TYPE DECIMAL(20, 8);

ALTER TABLE "PlatformPlan"
ALTER COLUMN "monthlyPrice" TYPE DECIMAL(20, 8);

ALTER TABLE "PlatformPayment"
ALTER COLUMN "amount" TYPE DECIMAL(20, 8);

ALTER TABLE "PartnerCommission"
ALTER COLUMN "amount" TYPE DECIMAL(20, 8);
