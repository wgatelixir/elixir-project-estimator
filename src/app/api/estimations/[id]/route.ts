import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { computeEstimationTotals } from "@/lib/calculations";
import { updateEstimationSchema } from "@/lib/validation";
import { toRecord } from "@/lib/serialize";
import type { EstimationState } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const row = await prisma.estimation.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(toRecord(row));
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateEstimationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.estimation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Totals are always recomputed server-side from the submitted data, never
  // trusted from the client, so they can't drift from what the UI displays.
  const nextData = (parsed.data.data ?? existing.data) as unknown as EstimationState;
  const totals = computeEstimationTotals(nextData);

  const row = await prisma.estimation.update({
    where: { id },
    data: {
      clientName: parsed.data.clientName ?? existing.clientName,
      projectName:
        parsed.data.projectName !== undefined ? parsed.data.projectName || null : existing.projectName,
      ownerName:
        parsed.data.ownerName !== undefined ? parsed.data.ownerName || null : existing.ownerName,
      status: parsed.data.status ?? existing.status,
      data: nextData as unknown as Prisma.InputJsonValue,
      totalHours: totals.totalEffortHours,
      totalPrice: totals.grandTotalPrice,
    },
  });

  return NextResponse.json(toRecord(row));
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await prisma.estimation.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
