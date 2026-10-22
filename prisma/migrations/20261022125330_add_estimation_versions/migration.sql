-- CreateTable
CREATE TABLE "EstimationVersion" (
    "id" TEXT NOT NULL,
    "estimationId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectName" TEXT,
    "ownerName" TEXT,
    "status" "EstimationStatus" NOT NULL,
    "opportunityPhase" "OpportunityPhase" NOT NULL,
    "closedWon" BOOLEAN NOT NULL,
    "closedWonDeadline" TIMESTAMP(3),
    "data" JSONB NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstimationVersion_estimationId_createdAt_idx" ON "EstimationVersion"("estimationId", "createdAt");

-- AddForeignKey
ALTER TABLE "EstimationVersion" ADD CONSTRAINT "EstimationVersion_estimationId_fkey" FOREIGN KEY ("estimationId") REFERENCES "Estimation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
