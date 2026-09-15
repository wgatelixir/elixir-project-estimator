-- CreateEnum
CREATE TYPE "EstimationStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateTable
CREATE TABLE "Estimation" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectName" TEXT,
    "ownerName" TEXT,
    "status" "EstimationStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estimation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Estimation_clientName_idx" ON "Estimation"("clientName");

-- CreateIndex
CREATE INDEX "Estimation_updatedAt_idx" ON "Estimation"("updatedAt");
