-- CreateTable
CREATE TABLE "CartEvent" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "restaurantSlug" TEXT NOT NULL,
    "totalArs" INTEGER NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "deliveryAddress" TEXT,
    "customerNote" TEXT,
    "itemsSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartEvent_restaurantId_idx" ON "CartEvent"("restaurantId");

-- CreateIndex
CREATE INDEX "CartEvent_restaurantSlug_idx" ON "CartEvent"("restaurantSlug");

-- CreateIndex
CREATE INDEX "CartEvent_createdAt_idx" ON "CartEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "CartEvent" ADD CONSTRAINT "CartEvent_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
