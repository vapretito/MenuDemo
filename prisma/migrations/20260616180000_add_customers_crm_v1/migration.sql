CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'menu',
    "firstOrderAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOrderAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOrderTotalArs" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpentArs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CartEvent"
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerName" TEXT NOT NULL DEFAULT 'Cliente',
ADD COLUMN     "customerWhatsapp" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'menu';

CREATE UNIQUE INDEX "Customer_restaurantId_whatsapp_key" ON "Customer"("restaurantId", "whatsapp");
CREATE INDEX "Customer_restaurantId_idx" ON "Customer"("restaurantId");
CREATE INDEX "Customer_lastOrderAt_idx" ON "Customer"("lastOrderAt");
CREATE INDEX "Customer_orderCount_idx" ON "Customer"("orderCount");
CREATE INDEX "Customer_createdAt_idx" ON "Customer"("createdAt");
CREATE INDEX "CartEvent_customerId_idx" ON "CartEvent"("customerId");
CREATE INDEX "CartEvent_customerWhatsapp_idx" ON "CartEvent"("customerWhatsapp");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CartEvent" ADD CONSTRAINT "CartEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
