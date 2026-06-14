-- Bind each collector to a single mobile/webview device after first normal login.
ALTER TABLE "User" ADD COLUMN "mobileDeviceHash" TEXT;
ALTER TABLE "User" ADD COLUMN "mobileDeviceName" TEXT;
ALTER TABLE "User" ADD COLUMN "mobileDeviceBoundAt" TIMESTAMP(3);
