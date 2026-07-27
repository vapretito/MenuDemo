CREATE TABLE "LocalCashClosure" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "businessDate" TEXT NOT NULL,
  "timeZone" TEXT NOT NULL,
  "totalOrders" INTEGER NOT NULL DEFAULT 0,
  "totalPaidArs" INTEGER NOT NULL DEFAULT 0,
  "totalItems" INTEGER NOT NULL DEFAULT 0,
  "averageTicketArs" INTEGER NOT NULL DEFAULT 0,
  "statusBreakdown" JSONB NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LocalCashClosure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocalCashClosure_restaurantId_businessDate_key"
ON "LocalCashClosure"("restaurantId", "businessDate");

CREATE INDEX "LocalCashClosure_restaurantId_idx"
ON "LocalCashClosure"("restaurantId");

CREATE INDEX "LocalCashClosure_businessDate_idx"
ON "LocalCashClosure"("businessDate");

CREATE INDEX "LocalCashClosure_createdAt_idx"
ON "LocalCashClosure"("createdAt");

ALTER TABLE "LocalCashClosure"
ADD CONSTRAINT "LocalCashClosure_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
