ALTER TABLE "Restaurant"
ADD COLUMN "whatsappReadyNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "whatsappReadyMessageTemplate" TEXT NOT NULL DEFAULT 'Hola {customerName}, tu pedido {pickupCode} ya esta listo para retirar en {restaurantName}.';

ALTER TABLE "Order"
ADD COLUMN "customerWhatsapp" TEXT;
