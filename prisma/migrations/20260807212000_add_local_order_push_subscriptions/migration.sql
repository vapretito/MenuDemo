CREATE TABLE "LocalOrderPushSubscription" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "targetUrl" TEXT NOT NULL,
  "expirationTime" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LocalOrderPushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocalOrderPushSubscription_orderId_endpoint_key"
ON "LocalOrderPushSubscription"("orderId", "endpoint");

CREATE INDEX "LocalOrderPushSubscription_restaurantId_idx"
ON "LocalOrderPushSubscription"("restaurantId");

CREATE INDEX "LocalOrderPushSubscription_orderId_idx"
ON "LocalOrderPushSubscription"("orderId");

CREATE INDEX "LocalOrderPushSubscription_createdAt_idx"
ON "LocalOrderPushSubscription"("createdAt");

ALTER TABLE "LocalOrderPushSubscription"
ADD CONSTRAINT "LocalOrderPushSubscription_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LocalOrderPushSubscription"
ADD CONSTRAINT "LocalOrderPushSubscription_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
