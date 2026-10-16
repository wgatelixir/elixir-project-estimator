// Turns the shared export model into the two download formats.

import type { EstimationExport } from "./model";
import { buildXlsx, type Sheet } from "./xlsx";

export function estimationToJson(model: EstimationExport): string {
  return JSON.stringify(model, null, 2);
}

/**
 * Three flat sheets: one row per workstream, one row per line (incl. a project
 * management line per workstream, so the lines add up to the total), and a
 * key/value summary with the estimation details and totals.
 */
export function estimationToXlsx(model: EstimationExport): Uint8Array {
  const workstreams: Sheet = {
    name: "Workstreams",
    columns: [
      { header: "Workstream key", width: 26 },
      { header: "Workstream", width: 30 },
      { header: "Phase", width: 8 },
      { header: "Hours", width: 10 },
      { header: "Hourly rate", width: 13, format: "currency" },
      { header: "Price", width: 14, format: "currency" },
      { header: "PM hours", width: 10 },
      { header: "PM hourly rate", width: 14, format: "currency" },
      { header: "PM price", width: 13, format: "currency" },
      { header: "Total price (incl. PM)", width: 20, format: "currency" },
    ],
    rows: model.workstreams.map((w) => [
      w.key,
      w.name,
      w.phase,
      w.hours,
      w.hourlyRate,
      w.price,
      w.pmHours,
      w.pmRate,
      w.pmPrice,
      w.totalPrice,
    ]),
  };

  const lines: Sheet = {
    name: "Lines",
    columns: [
      { header: "Workstream key", width: 26 },
      { header: "Workstream", width: 26 },
      { header: "Phase", width: 8 },
      { header: "Line ID", width: 40 },
      { header: "Activity", width: 18 },
      { header: "Topic", width: 36 },
      { header: "Description", width: 50 },
      { header: "Duration (h)", width: 12 },
      { header: "Standard effort (h)", width: 18 },
      { header: "Complexity", width: 18 },
      { header: "Complexity adjustment (h)", width: 24 },
      { header: "Final effort (h)", width: 15 },
      { header: "Hourly rate", width: 13, format: "currency" },
      { header: "Price", width: 13, format: "currency" },
    ],
    rows: model.workstreams.flatMap((w) =>
      w.lines.map((l) => [
        l.workstreamKey,
        l.workstream,
        l.phase,
        l.lineId,
        l.activity,
        l.topic,
        l.description,
        l.durationHours,
        l.standardEffortHours,
        l.complexity,
        l.complexityAdjustmentHours,
        l.finalEffortHours,
        l.hourlyRate,
        l.price,
      ])
    ),
  };

  const e = model.estimation;
  const t = model.totals;
  const summary: Sheet = {
    name: "Summary",
    columns: [
      { header: "Field", width: 30 },
      { header: "Value", width: 40 },
    ],
    rows: [
      ["Client", e.clientName],
      ["Project", e.projectName],
      ["Owner", e.ownerName],
      ["Status", e.status],
      ["Estimation ID", e.id],
      ["Language", model.locale],
      ["Currency", model.currency],
      ["Exported at (UTC)", model.exportedAt],
      ["Project management %", model.projectManagement.percent],
      ["Project management hourly rate", model.projectManagement.hourlyRate],
      ["Hours (excl. PM)", t.hours],
      ["Price (excl. PM)", t.price],
      ["PM hours", t.pmHours],
      ["PM price", t.pmPrice],
      ["Total hours", t.totalHours],
      ["Total price (incl. PM)", t.totalPrice],
      ...model.subscriptions.map((s): [string, number] => [`Subscription: ${s.name} (${s.quantity}×)`, s.price]),
      ["Subscriptions price", t.subscriptionsPrice],
      ["Grand total price", t.grandTotalPrice],
    ],
  };

  return buildXlsx([workstreams, lines, summary]);
}
