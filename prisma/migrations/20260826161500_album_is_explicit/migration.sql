-- AlterTable
ALTER TABLE "Album" ADD COLUMN "isExplicit" BOOLEAN NOT NULL DEFAULT false;

-- Существующие альбомы: тег, если есть хотя бы один explicit-трек
UPDATE "Album" AS a
SET "isExplicit" = true
WHERE EXISTS (
  SELECT 1 FROM "Track" t
  WHERE t."albumId" = a."id" AND t."isExplicit" = true
);
