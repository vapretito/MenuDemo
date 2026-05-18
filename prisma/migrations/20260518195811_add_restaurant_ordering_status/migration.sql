-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "closedMessage" TEXT NOT NULL DEFAULT 'Estamos cerrados por ahora. Podés revisar el menú y consultarnos por WhatsApp.',
ADD COLUMN     "isAcceptingOrders" BOOLEAN NOT NULL DEFAULT true;
