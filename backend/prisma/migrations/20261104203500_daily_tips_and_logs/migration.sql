-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "receiveDailyTips" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "daily_tip_dispatches" (
    "id" TEXT NOT NULL,
    "dispatchDate" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL DEFAULT 'SCHEDULED_7AM',
    "tipIndex" INTEGER NOT NULL,
    "tipCategory" TEXT NOT NULL,
    "tipTitle" TEXT NOT NULL,
    "tipSummary" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "totalSubscribers" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "daily_tip_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "daily_tip_email_logs" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "dispatchDate" TEXT NOT NULL,
    "userId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "tipTitle" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "messageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_tip_email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_tip_dispatches_dispatchDate_idx" ON "daily_tip_dispatches"("dispatchDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_tip_email_logs_dispatchDate_idx" ON "daily_tip_email_logs"("dispatchDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_tip_email_logs_recipientEmail_idx" ON "daily_tip_email_logs"("recipientEmail");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'daily_tip_email_logs_dispatchId_fkey'
    ) THEN
        ALTER TABLE "daily_tip_email_logs" ADD CONSTRAINT "daily_tip_email_logs_dispatchId_fkey"
        FOREIGN KEY ("dispatchId") REFERENCES "daily_tip_dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'daily_tip_email_logs_userId_fkey'
    ) THEN
        ALTER TABLE "daily_tip_email_logs" ADD CONSTRAINT "daily_tip_email_logs_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
