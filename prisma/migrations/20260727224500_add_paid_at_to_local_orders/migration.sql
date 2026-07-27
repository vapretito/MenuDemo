ALTER TABLE "Order"
ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE INDEX "Order_paidAt_idx" ON "Order"("paidAt");
