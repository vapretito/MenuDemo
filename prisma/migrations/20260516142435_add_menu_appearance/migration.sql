-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "menuTemplate" TEXT NOT NULL DEFAULT 'classic-delivery';
