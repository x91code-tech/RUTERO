ALTER TABLE "PlatformPlan"
ADD CONSTRAINT "PlatformPlan_monthlyPrice_nonnegative_check" CHECK ("monthlyPrice" >= 0),
ADD CONSTRAINT "PlatformPlan_maxUsers_positive_check" CHECK ("maxUsers" >= 1),
ADD CONSTRAINT "PlatformPlan_maxSellers_nonnegative_check" CHECK ("maxSellers" >= 0),
ADD CONSTRAINT "PlatformPlan_maxCompanies_nonnegative_check" CHECK ("maxCompanies" >= 0);

ALTER TABLE "SubscriptionPlan"
ADD CONSTRAINT "SubscriptionPlan_billingAmount_nonnegative_check" CHECK ("billingAmount" >= 0),
ADD CONSTRAINT "SubscriptionPlan_maxUsers_positive_check" CHECK ("maxUsers" >= 1),
ADD CONSTRAINT "SubscriptionPlan_maxSellers_nonnegative_check" CHECK ("maxSellers" >= 0);

ALTER TABLE "PlatformSettings"
ADD CONSTRAINT "PlatformSettings_gracePeriodDays_range_check" CHECK ("gracePeriodDays" BETWEEN 0 AND 30);

ALTER TABLE "PartnerProfile"
ADD CONSTRAINT "PartnerProfile_maxCompanies_nonnegative_check" CHECK ("maxCompanies" >= 0),
ADD CONSTRAINT "PartnerProfile_commissionRate_range_check" CHECK ("commissionRate" BETWEEN 0 AND 1);

ALTER TABLE "PlatformPayment"
ADD CONSTRAINT "PlatformPayment_amount_positive_check" CHECK ("amount" > 0),
ADD CONSTRAINT "PlatformPayment_periodMonths_range_check" CHECK ("periodMonths" BETWEEN 1 AND 12),
ADD CONSTRAINT "PlatformPayment_reference_length_check" CHECK (length(btrim("transactionRef")) BETWEEN 3 AND 160);

ALTER TABLE "PartnerCommission"
ADD CONSTRAINT "PartnerCommission_amount_nonnegative_check" CHECK ("amount" >= 0),
ADD CONSTRAINT "PartnerCommission_rate_range_check" CHECK ("commissionRate" BETWEEN 0 AND 1);
