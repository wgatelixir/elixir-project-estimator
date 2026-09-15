import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createDefaultEstimationState } from "@/lib/templates";
import { computeEstimationTotals } from "@/lib/calculations";
import { createEstimationSchema } from "@/lib/validation";
import { toSummary } from "@/lib/serialize";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  const rows = await prisma.estimation.findMany({
    where: q
      ? {
          OR: [
            { clientName: { contains: q, mode: "insensitive" } },
            { projectName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(rows.map(toSummary));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = createEstimationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = createDefaultEstimationState();
  const totals = computeEstimationTotals(data);

  const row = await prisma.estimation.create({
    data: {
      clientName: parsed.data.clientName,
      projectName: parsed.data.projectName || null,
      ownerName: parsed.data.ownerName || null,
      status: parsed.data.status ?? "DRAFT",
      data: data as unknown as Prisma.InputJsonValue,
      totalHours: totals.totalEffortHours,
      totalPrice: totals.grandTotalPrice,
    },
  });

  return NextResponse.json(toSummary(row), { status: 201 });
}
