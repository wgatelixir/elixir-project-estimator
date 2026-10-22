import type { Estimation, Prisma, PrismaClient } from "@/generated/prisma/client";

// Accepts either the top-level prisma client or the transaction client
// `$transaction` hands its callback, since every caller snapshots in the
// same transaction as the write it's capturing.
type PrismaLike = PrismaClient | Prisma.TransactionClient;

/** Inserts a read-only snapshot of `row` as-saved, numbered v1, v2, v3... in save order for this estimation. Call this in the same transaction as the write that produced it. */
export async function snapshotEstimationVersion(client: PrismaLike, row: Estimation, note?: string) {
  const versionNumber = (await client.estimationVersion.count({ where: { estimationId: row.id } })) + 1;
  return client.estimationVersion.create({
    data: {
      estimationId: row.id,
      versionNumber,
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
