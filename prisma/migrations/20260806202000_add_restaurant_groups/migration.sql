CREATE TABLE "RestaurantGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "accentColor" TEXT NOT NULL DEFAULT '#1d4ed8',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RestaurantGroup_slug_key" ON "RestaurantGroup"("slug");
CREATE INDEX "RestaurantGroup_isActive_idx" ON "RestaurantGroup"("isActive");

ALTER TABLE "Restaurant"
ADD COLUMN "groupId" TEXT;

CREATE INDEX "Restaurant_groupId_idx" ON "Restaurant"("groupId");

ALTER TABLE "Restaurant"
ADD CONSTRAINT "Restaurant_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "RestaurantGroup"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
