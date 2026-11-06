import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import type { EstimationState } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { STANDARD_WORKSTREAM_TEMPLATES } from "@/lib/templates";
import { computeEstimationTotals } from "@/lib/calculations";
import { snapshotEstimationVersion } from "@/lib/versioning";

// One-time migration: the "business_assessment" workstream was renamed from
// "Business Assessment" to "Assessment & Scoping" (see templates.ts). A
// workstream only gets its label patched when it's STILL EXACTLY the old
// text in both languages, so a client who renamed it themselves (to
// anything, the new wording included) is never overwritten. Items, hours,
// complexity and enabled state are untouched; totals are recomputed but
// don't actually change, since only label text moves. Each touched
// estimation also gets a new version snapshot (see versioning.ts), so the
// change shows up in its history and can be undone with Restore. Delete
// this route once it's been run against production.

const OLD_LABEL = { en: "Business Assessment", nl: "Business Assessment" };
const KEY = "business_assessment";

const newLabel = STANDARD_WORKSTREAM_TEMPLATES.find((ws) => ws.key === KEY)?.label;

export async function POST() {
  if (!newLabel) {
    return NextResponse.json({ error: `No "${KEY}" workstream in the current template` }, { status: 500 });
  }

  const rows = await prisma.estimation.findMany();

  let estimationsUpdated = 0;

  for (const row of rows) {
    const data = row.data as unknown as EstimationState;
    const ws = (data.standardWorkstreams ?? []).find((w) => w.key === KEY);
    if (!ws || ws.label.en !== OLD_LABEL.en || ws.label.nl !== OLD_LABEL.nl) continue;

    ws.label = newLabel;

    const totals = computeEstimationTotals(data);
    await prisma.$transaction(async (tx) => {
      const updated = await tx.estimation.update({
        where: { id: row.id },
        data: {
          data: data as unknown as Prisma.InputJsonValue,
          totalHours: totals.totalEffortHours,
          totalPrice: totals.grandTotalPrice,
        },
      });
      await snapshotEstimationVersion(tx, updated, 'Workstream label refreshed: "Business Assessment" → "Assessment & Scoping"');
    });
    estimationsUpdated++;
  }

  return NextResponse.json({
    estimationsScanned: rows.length,
    estimationsUpdated,
  });
}
