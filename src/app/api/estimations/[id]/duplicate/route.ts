import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toSummary } from "@/lib/serialize";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * "Snapshot" a working estimation: copies its current state into a new,
 * independent record so the original can keep being edited while this copy
 * is frozen for a proposal.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const existing = await prisma.estimation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await prisma.estimation.create({
    data: {
      clientName: existing.clientName,
      projectName: existing.projectName,
      ownerName: existing.ownerName,
      status: "DRAFT",
      data: existing.data as Prisma.InputJsonValue,
      totalHours: existing.totalHours,
      totalPrice: existing.totalPrice,
    },
  });

  return NextResponse.json(toSummary(row), { status: 201 });
}
