ALTER TABLE "PlatformPlan"
ADD CONSTRAINT "PlatformPlan_sellers_within_users_check" CHECK ("maxSellers" <= "maxUsers"),
ADD CONSTRAINT "PlatformPlan_partner_company_limit_check"
CHECK ("type" <> 'PARTNER' OR "maxCompanies" >= 1);

ALTER TABLE "SubscriptionPlan"
ADD CONSTRAINT "SubscriptionPlan_sellers_within_users_check" CHECK ("maxSellers" <= "maxUsers");
