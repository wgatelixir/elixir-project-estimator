import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { computeEstimationTotals } from "@/lib/calculations";
import { toRecord } from "@/lib/serialize";
import { snapshotEstimationVersion } from "@/lib/versioning";
import type { EstimationState } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Makes an earlier EstimationVersion the estimation's live state again. The
 * restore itself is captured as a new version too (noted with where it came
 * from), so restoring never loses anything from the history.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const versionId = typeof body?.versionId === "string" ? body.versionId : null;
  if (!versionId) {
    return NextResponse.json({ error: "versionId is required" }, { status: 400 });
  }

  const version = await prisma.estimationVersion.findUnique({ where: { id: versionId } });
  if (!version || version.estimationId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = version.data as unknown as EstimationState;
  const totals = computeEstimationTotals(data);
  const note = `Restored from v${version.versionNumber} (${version.createdAt.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })})`;

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.estimation.update({
      where: { id },
      data: {
        clientName: version.clientName,
        projectName: version.projectName,
        ownerName: version.ownerName,
        status: version.status,
        opportunityPhase: version.opportunityPhase,
        closedWon: version.closedWon,
        closedWonDeadline: version.closedWonDeadline,
        data: version.data as Prisma.InputJsonValue,
        totalHours: totals.totalEffortHours,
        totalPrice: totals.grandTotalPrice,
      },
    });
    await snapshotEstimationVersion(tx, updated, note);
    return updated;
  });

  return NextResponse.json(toRecord(row));
}
