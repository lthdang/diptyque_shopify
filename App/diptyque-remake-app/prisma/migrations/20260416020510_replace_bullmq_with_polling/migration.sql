/*
  Warnings:

  - You are about to drop the column `bullJobId` on the `ScheduledPublish` table. All the data in the column will be lost.
  - Added the required column `accessToken` to the `ScheduledPublish` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: add accessToken as nullable first, backfill from Session table, then make NOT NULL
ALTER TABLE "ScheduledPublish" DROP COLUMN "bullJobId";
ALTER TABLE "ScheduledPublish" ADD COLUMN "accessToken" TEXT;

-- Backfill accessToken from the Session table for existing SCHEDULED rows
UPDATE "ScheduledPublish" sp
SET "accessToken" = s."accessToken"
FROM "Session" s
WHERE s."shop" = sp."shop"
  AND s."isOnline" = false
  AND s."accessToken" IS NOT NULL;

-- For any rows that couldn't be backfilled, mark them as FAILED
UPDATE "ScheduledPublish"
SET "status" = 'FAILED', "errorMessage" = 'Migration: no offline access token found'
WHERE "accessToken" IS NULL AND "status" = 'SCHEDULED';

-- Set a placeholder for remaining NULL rows (already PUBLISHED/CANCELLED/FAILED)
UPDATE "ScheduledPublish"
SET "accessToken" = 'migrated-no-token'
WHERE "accessToken" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "ScheduledPublish" ALTER COLUMN "accessToken" SET NOT NULL;

-- CreateIndex
CREATE INDEX "ScheduledPublish_status_scheduledAt_idx" ON "ScheduledPublish"("status", "scheduledAt");
