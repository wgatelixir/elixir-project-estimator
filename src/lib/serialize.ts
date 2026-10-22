import type { Estimation, EstimationVersion } from "@/generated/prisma/client";
import type {
  EstimationRecord,
  EstimationState,
  EstimationSummary,
  EstimationVersionRecord,
  EstimationVersionSummary,
} from "./types";

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

// The versions-list endpoint selects every column but `data` (it can be a
// sizeable JSON blob per row, and the list view never needs it), so this
// accepts rows with or without that field.
export function toVersionSummary(row: Omit<EstimationVersion, "data">): EstimationVersionSummary {
  return {
    id: row.id,
    estimationId: row.estimationId,
    clientName: row.clientName,
    projectName: row.projectName,
    ownerName: row.ownerName,
    status: row.status,
    opportunityPhase: row.opportunityPhase,
    closedWon: row.closedWon,
    closedWonDeadline: row.closedWonDeadline ? row.closedWonDeadline.toISOString() : null,
    totalHours: row.totalHours,
    totalPrice: row.totalPrice,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toVersionRecord(row: EstimationVersion): EstimationVersionRecord {
  return {
    ...toVersionSummary(row),
    data: row.data as unknown as EstimationState,
  };
}
