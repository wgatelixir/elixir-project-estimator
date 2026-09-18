import { NextResponse } from "next/server";
import type { EstimationState } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { STANDARD_WORKSTREAM_TEMPLATES } from "@/lib/templates";

// One-time migration: estimations created before the Business Assessment
// line-item comments (Interview deliverable descriptions, "Only for
// uni/multi-dimensional projects" tags) were added carry a frozen snapshot
// of the old data, so the new comment text never reaches them on its own.
// This backfills only the `comment` field on business_assessment items,
// only where it's currently empty - never touching a topic, hours,
// complexity or enabled state the user may have already edited. Delete this
// route once it's been run against production.

const businessAssessment = STANDARD_WORKSTREAM_TEMPLATES.find((ws) => ws.key === "business_assessment");
const canonicalComments = new Map(
  (businessAssessment?.items ?? []).filter((item) => item.comment).map((item) => [item.id, item.comment as string])
);

export async function POST() {
  const rows = await prisma.estimation.findMany({ select: { id: true, data: true } });

  let estimationsUpdated = 0;
  let itemsPatched = 0;

  for (const row of rows) {
    const data = row.data as unknown as EstimationState;
    let changed = false;

    for (const ws of data.standardWorkstreams ?? []) {
      if (ws.key !== "business_assessment") continue;
      for (const item of ws.items ?? []) {
        if (item.comment) continue;
        const canonical = canonicalComments.get(item.id);
        if (!canonical) continue;
        item.comment = canonical;
        changed = true;
        itemsPatched++;
      }
    }

    if (changed) {
      await prisma.estimation.update({
        where: { id: row.id },
        data: { data: data as unknown as object },
      });
      estimationsUpdated++;
    }
  }

  return NextResponse.json({
    estimationsScanned: rows.length,
    estimationsUpdated,
    itemsPatched,
  });
}
