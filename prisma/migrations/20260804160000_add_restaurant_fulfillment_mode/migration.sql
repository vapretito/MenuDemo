CREATE TYPE "RestaurantFulfillmentMode" AS ENUM ('DELIVERY_ONLY', 'TAKEAWAY_ONLY', 'DELIVERY_AND_TAKEAWAY');

ALTER TABLE "Restaurant"
ADD COLUMN "fulfillmentMode" "RestaurantFulfillmentMode" NOT NULL DEFAULT 'DELIVERY_ONLY';
