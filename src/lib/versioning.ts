import type { Estimation, Prisma, PrismaClient } from "@/generated/prisma/client";

// Accepts either the top-level prisma client or the transaction client
// `$transaction` hands its callback, since every caller snapshots in the
// same transaction as the write it's capturing.
type PrismaLike = PrismaClient | Prisma.TransactionClient;

/** Inserts a read-only snapshot of `row` as-saved. Call this in the same transaction as the write that produced it. */
export function snapshotEstimationVersion(client: PrismaLike, row: Estimation, note?: string) {
  return client.estimationVersion.create({
    data: {
      estimationId: row.id,
      clientName: row.clientName,
      projectName: row.projectName,
      ownerName: row.ownerName,
      status: row.status,
      opportunityPhase: row.opportunityPhase,
      closedWon: row.closedWon,
      closedWonDeadline: row.closedWonDeadline,
      data: row.data as Prisma.InputJsonValue,
      totalHours: row.totalHours,
      totalPrice: row.totalPrice,
      note: note ?? null,
    },
  });
}
