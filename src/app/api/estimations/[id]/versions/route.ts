import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toVersionSummary } from "@/lib/serialize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const rows = await prisma.estimationVersion.findMany({
    where: { estimationId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      estimationId: true,
      versionNumber: true,
      clientName: true,
      projectName: true,
      ownerName: true,
      status: true,
      opportunityPhase: true,
      closedWon: true,
      closedWonDeadline: true,
      totalHours: true,
      totalPrice: true,
      note: true,
      createdAt: true,
    },
  });
  return NextResponse.json(rows.map(toVersionSummary));
}
