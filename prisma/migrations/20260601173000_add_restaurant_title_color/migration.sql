ALTER TABLE "Restaurant"
ADD COLUMN "titleColor" TEXT NOT NULL DEFAULT '#ffffff';

UPDATE "Restaurant"
SET "titleColor" = "text"
WHERE "titleColor" = '#ffffff';
