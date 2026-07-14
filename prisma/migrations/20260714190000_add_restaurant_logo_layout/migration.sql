-- AlterTable
ALTER TABLE "Restaurant"
ADD COLUMN "logoPosition" TEXT NOT NULL DEFAULT 'left',
ADD COLUMN "logoSize" TEXT NOT NULL DEFAULT 'medium';
