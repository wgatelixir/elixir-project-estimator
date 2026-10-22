import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import type { EstimationState, LocalizedString } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { STANDARD_WORKSTREAM_TEMPLATES } from "@/lib/templates";
import { computeEstimationTotals } from "@/lib/calculations";
import { snapshotEstimationVersion } from "@/lib/versioning";

// One-time migration: Sales and Marketing Session/Session Prep lines whose
// topic was still the old generic "Sales Workshop N"/"Marketing Workshop N"
// label (see the "Give Sales and Marketing workshops descriptive titles"
// commit in templates.ts) get the new descriptive topic. A line only gets
// touched when its topic is STILL EXACTLY the old generic text in both
// languages, so a line the user has already renamed - to anything, the new
// wording included - is never overwritten. comment/hours/complexity/enabled
// are untouched; totals are recomputed but don't actually change, since only
// label text moves. Each touched estimation also gets a new version
// snapshot (see versioning.ts), so the change shows up in its history and
// can be undone with Restore. Delete this route once it's been run against
// production.

const OLD_TOPICS: Record<string, LocalizedString> = {
  "sales_implementation-2-sales-workshop-1": { en: "Sales Workshop 1", nl: "Sales workshop 1" },
  "sales_implementation-3-sales-workshop-2": { en: "Sales Workshop 2", nl: "Sales workshop 2" },
  "sales_implementation-4-sales-workshop-3": { en: "Sales Workshop 3", nl: "Sales workshop 3" },
  "sales_implementation-5-sales-workshop-4": { en: "Sales Workshop 4", nl: "Sales workshop 4" },
  "sales_implementation-12-sales-workshop-1": { en: "Sales Workshop 1", nl: "Sales workshop 1" },
  "sales_implementation-13-sales-workshop-2": { en: "Sales Workshop 2", nl: "Sales workshop 2" },
  "sales_implementation-14-sales-workshop-3": { en: "Sales Workshop 3", nl: "Sales workshop 3" },
  "sales_implementation-15-sales-workshop-4": { en: "Sales Workshop 4", nl: "Sales workshop 4" },
  "marketing_implementation-2-marketing-workshop-1": { en: "Marketing Workshop 1", nl: "Marketing workshop 1" },
  "marketing_implementation-3-marketing-workshop-2": { en: "Marketing Workshop 2", nl: "Marketing workshop 2" },
  "marketing_implementation-4-marketing-workshop-3": { en: "Marketing Workshop 3", nl: "Marketing workshop 3" },
  "marketing_implementation-5-marketing-workshop-4": { en: "Marketing Workshop 4", nl: "Marketing workshop 4" },
  "marketing_implementation-6-marketing-workshop-5": { en: "Marketing Workshop 5", nl: "Marketing workshop 5" },
  "marketing_implementation-7-marketing-workshop-6": { en: "Marketing Workshop 6", nl: "Marketing workshop 6" },
  "marketing_implementation-8-marketing-workshop-7": { en: "Marketing Workshop 7", nl: "Marketing workshop 7" },
  "marketing_implementation-9-marketing-validation-session-1": {
    en: "Marketing Validation Session 1",
    nl: "Marketing validatiesessie 1",
  },
  "marketing_implementation-10-marketing-validation-session-2": {
    en: "Marketing Validation Session 2",
    nl: "Marketing validatiesessie 2",
  },
  "marketing_implementation-12-marketing-workshop-1": { en: "Marketing Workshop 1", nl: "Marketing workshop 1" },
  "marketing_implementation-13-marketing-workshop-2": { en: "Marketing Workshop 2", nl: "Marketing workshop 2" },
  "marketing_implementation-14-marketing-workshop-3": { en: "Marketing Workshop 3", nl: "Marketing workshop 3" },
  "marketing_implementation-15-marketing-workshop-4": { en: "Marketing Workshop 4", nl: "Marketing workshop 4" },
  "marketing_implementation-16-marketing-workshop-5": { en: "Marketing Workshop 5", nl: "Marketing workshop 5" },
  "marketing_implementation-17-marketing-workshop-6": { en: "Marketing Workshop 6", nl: "Marketing workshop 6" },
  "marketing_implementation-18-marketing-workshop-7": { en: "Marketing Workshop 7", nl: "Marketing workshop 7" },
};

// Pulled live from the current template rather than hardcoded a second time,
// so this backfill can never drift from whatever templates.ts says today.
const newTopicById = new Map(
  STANDARD_WORKSTREAM_TEMPLATES.flatMap((ws) => ws.items)
    .filter((item) => item.id in OLD_TOPICS)
    .map((item) => [item.id, item.topic])
);

export async function POST() {
  const rows = await prisma.estimation.findMany();

  let estimationsUpdated = 0;
  let itemsPatched = 0;

  for (const row of rows) {
    const data = row.data as unknown as EstimationState;
    let changed = false;

    for (const ws of data.standardWorkstreams ?? []) {
      for (const item of ws.items ?? []) {
        const old = OLD_TOPICS[item.id];
        const fresh = newTopicById.get(item.id);
        if (!old || !fresh) continue;
        if (item.topic.en !== old.en || item.topic.nl !== old.nl) continue;
        item.topic = fresh;
        changed = true;
        itemsPatched++;
      }
    }

    if (!changed) continue;

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
      await snapshotEstimationVersion(tx, updated, "Workshop titles refreshed (bulk update)");
    });
    estimationsUpdated++;
  }

  return NextResponse.json({
    estimationsScanned: rows.length,
    estimationsUpdated,
    itemsPatched,
  });
}
