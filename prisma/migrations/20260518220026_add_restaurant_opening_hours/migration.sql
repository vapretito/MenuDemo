-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "openingHours" JSONB,
ADD COLUMN     "openingHoursNote" TEXT NOT NULL DEFAULT 'Horarios sujetos a disponibilidad del restaurante.';
