-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "whatsappFooterMessage" TEXT NOT NULL DEFAULT 'Por favor confirmar disponibilidad y tiempo estimado.',
ADD COLUMN     "whatsappIntroMessage" TEXT NOT NULL DEFAULT 'Hola, quiero hacer este pedido desde el menú online:';
