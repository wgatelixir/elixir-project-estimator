-- AlterTable: add as nullable first so existing rows can be backfilled.
ALTER TABLE "EstimationVersion" ADD COLUMN "versionNumber" INTEGER;

-- Backfill: number each estimation's own versions 1, 2, 3... in save order.
UPDATE "EstimationVersion" AS v
SET "versionNumber" = numbered."rowNumber"
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "estimationId" ORDER BY "createdAt" ASC) AS "rowNumber"
  FROM "EstimationVersion"
) AS numbered
WHERE v."id" = numbered."id";

-- AlterTable: now that every row has a value, make it required.
ALTER TABLE "EstimationVersion" ALTER COLUMN "versionNumber" SET NOT NULL;
