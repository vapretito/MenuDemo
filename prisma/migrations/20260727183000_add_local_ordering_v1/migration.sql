-- Create enums
CREATE TYPE "RestaurantOrderingExperience" AS ENUM ('DELIVERY', 'LOCAL_QR');
CREATE TYPE "ServiceMode" AS ENUM ('TABLE_SERVICE', 'COUNTER_PICKUP', 'BOTH');
CREATE TYPE "LocalPaymentTiming" AS ENUM ('PAY_BEFORE_PREPARATION', 'PAY_LATER');
CREATE TYPE "LocalOrderSource" AS ENUM ('WHATSAPP', 'LOCAL_QR');
CREATE TYPE "LocalOrderStatus" AS ENUM ('AWAITING_PAYMENT', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "LocalPaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
CREATE TYPE "GuestSessionEntryPoint" AS ENUM ('GENERAL_QR', 'LOCATION_QR');

-- Alter restaurant
ALTER TABLE "Restaurant"
ADD COLUMN "defaultOrderingExperience" "RestaurantOrderingExperience" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN "localOrderingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "serviceMode" "ServiceMode" NOT NULL DEFAULT 'COUNTER_PICKUP',
ADD COLUMN "localPaymentTiming" "LocalPaymentTiming" NOT NULL DEFAULT 'PAY_BEFORE_PREPARATION',
ADD COLUMN "unpaidOrderExpirationMinutes" INTEGER NOT NULL DEFAULT 15;

-- Create service locations
CREATE TABLE "ServiceLocation" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "publicToken" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceLocation_pkey" PRIMARY KEY ("id")
);

-- Create guest sessions
CREATE TABLE "GuestSession" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "serviceLocationId" TEXT,
  "entryPoint" "GuestSessionEntryPoint" NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuestSession_pkey" PRIMARY KEY ("id")
);

-- Create local orders
CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "source" "LocalOrderSource" NOT NULL DEFAULT 'LOCAL_QR',
  "serviceMode" "ServiceMode" NOT NULL,
  "serviceLocationId" TEXT,
  "customerName" TEXT,
  "pickupCode" TEXT,
  "status" "LocalOrderStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
  "paymentStatus" "LocalPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "totalArs" INTEGER NOT NULL,
  "customerNote" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT,
  "productName" TEXT NOT NULL,
  "unitPriceArs" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "notes" TEXT,
  "subtotalArs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- Constraints and indexes
CREATE UNIQUE INDEX "ServiceLocation_publicToken_key" ON "ServiceLocation"("publicToken");
CREATE UNIQUE INDEX "ServiceLocation_restaurantId_name_key" ON "ServiceLocation"("restaurantId", "name");
CREATE INDEX "ServiceLocation_restaurantId_idx" ON "ServiceLocation"("restaurantId");
CREATE INDEX "ServiceLocation_restaurantId_isActive_idx" ON "ServiceLocation"("restaurantId", "isActive");

CREATE UNIQUE INDEX "GuestSession_sessionToken_key" ON "GuestSession"("sessionToken");
CREATE INDEX "GuestSession_restaurantId_idx" ON "GuestSession"("restaurantId");
CREATE INDEX "GuestSession_serviceLocationId_idx" ON "GuestSession"("serviceLocationId");
CREATE INDEX "GuestSession_entryPoint_idx" ON "GuestSession"("entryPoint");
CREATE INDEX "GuestSession_expiresAt_idx" ON "GuestSession"("expiresAt");

CREATE UNIQUE INDEX "Order_restaurantId_pickupCode_key" ON "Order"("restaurantId", "pickupCode");
CREATE INDEX "Order_restaurantId_idx" ON "Order"("restaurantId");
CREATE INDEX "Order_restaurantId_status_idx" ON "Order"("restaurantId", "status");
CREATE INDEX "Order_restaurantId_paymentStatus_idx" ON "Order"("restaurantId", "paymentStatus");
CREATE INDEX "Order_serviceLocationId_idx" ON "Order"("serviceLocationId");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX "Order_expiresAt_idx" ON "Order"("expiresAt");

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

ALTER TABLE "ServiceLocation"
ADD CONSTRAINT "ServiceLocation_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuestSession"
ADD CONSTRAINT "GuestSession_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GuestSession"
ADD CONSTRAINT "GuestSession_serviceLocationId_fkey"
FOREIGN KEY ("serviceLocationId") REFERENCES "ServiceLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_serviceLocationId_fkey"
FOREIGN KEY ("serviceLocationId") REFERENCES "ServiceLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
