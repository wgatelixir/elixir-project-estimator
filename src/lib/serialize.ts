import type { Estimation } from "@/generated/prisma/client";
import type { EstimationRecord, EstimationState, EstimationSummary } from "./types";

export function toSummary(row: Estimation): EstimationSummary {
  return {
    id: row.id,
    clientName: row.clientName,
    projectName: row.projectName,
    ownerName: row.ownerName,
    status: row.status,
    opportunityPhase: row.opportunityPhase,
    closedWon: row.closedWon,
    closedWonDeadline: row.closedWonDeadline ? row.closedWonDeadline.toISOString() : null,
    totalHours: row.totalHours,
    totalPrice: row.totalPrice,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toRecord(row: Estimation): EstimationRecord {
  return {
    ...toSummary(row),
    data: row.data as unknown as EstimationState,
  };
}
