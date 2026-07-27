ALTER TABLE "Order"
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedByAdmin" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Order_deletedAt_idx" ON "Order"("deletedAt");
