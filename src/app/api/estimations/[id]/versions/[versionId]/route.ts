import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toVersionRecord } from "@/lib/serialize";

interface RouteParams {
  params: Promise<{ id: string; versionId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id, versionId } = await params;
  const row = await prisma.estimationVersion.findUnique({ where: { id: versionId } });
  if (!row || row.estimationId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(toVersionRecord(row));
}
