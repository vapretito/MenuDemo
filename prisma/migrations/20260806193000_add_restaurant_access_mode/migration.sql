CREATE TYPE "RestaurantAccessMode" AS ENUM ('SUBDOMAIN', 'CONTAINER_PATH');

ALTER TABLE "Restaurant"
ADD COLUMN "accessMode" "RestaurantAccessMode" NOT NULL DEFAULT 'SUBDOMAIN';
