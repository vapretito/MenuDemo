-- CreateTable
CREATE TABLE "CashClosure" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "businessDate" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "totalEvents" INTEGER NOT NULL DEFAULT 0,
    "totalEstimatedArs" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "averageTicketArs" INTEGER NOT NULL DEFAULT 0,
    "paymentBreakdown" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashClosure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashClosure_restaurantId_idx" ON "CashClosure"("restaurantId");

-- CreateIndex
CREATE INDEX "CashClosure_businessDate_idx" ON "CashClosure"("businessDate");

-- CreateIndex
CREATE INDEX "CashClosure_createdAt_idx" ON "CashClosure"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CashClosure_restaurantId_businessDate_key" ON "CashClosure"("restaurantId", "businessDate");

-- AddForeignKey
ALTER TABLE "CashClosure" ADD CONSTRAINT "CashClosure_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
