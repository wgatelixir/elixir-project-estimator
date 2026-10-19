// Workstreams the user adds on the Cover page for client-specific work
// (support, change requests, continuous improvements, ...). They are ordinary
// StandardWorkstreams plus a `custom` block, so line items, phases, links,
// totals, the Proposal Summary and the export all work on them unchanged.

import { STANDARD_WORKSTREAM_TEMPLATES } from "./templates";
import type { CustomWorkstreamType, LocalizedString, StandardWorkstream } from "./types";

export const CUSTOM_WORKSTREAM_TYPES: CustomWorkstreamType[] = [
  "support",
  "change_requests",
  "continuous_improvement",
  "other",
];

export const CUSTOM_WORKSTREAM_TYPE_LABELS: Record<CustomWorkstreamType, LocalizedString> = {
  support: { en: "Support", nl: "Support" },
  change_requests: { en: "Change requests", nl: "Change requests" },
  continuous_improvement: { en: "Continuous improvement", nl: "Continuous improvement" },
  other: { en: "Other", nl: "Overig" },
};

/** Same as the hub implementations' tier; editable per workstream like any other rate. */
export const CUSTOM_WORKSTREAM_DEFAULT_RATE = 135;
export const DEFAULT_RETAINER_MONTHS = 12;

// Same session/setup complexity scale as the hub implementation tabs.
const COMPLEXITY_SOURCE = STANDARD_WORKSTREAM_TEMPLATES.find((ws) => ws.key === "sales_implementation")!;

export function isCustomWorkstream(ws: StandardWorkstream): boolean {
  return ws.custom !== undefined;
}

export function createCustomWorkstream(name: string, type: CustomWorkstreamType): StandardWorkstream {
  const label = name.trim() || CUSTOM_WORKSTREAM_TYPE_LABELS[type].en;
  return {
    key: `custom-${Math.random().toString(36).slice(2, 10)}`,
    label: { en: label, nl: name.trim() || CUSTOM_WORKSTREAM_TYPE_LABELS[type].nl },
    enabled: true,
    phase: 1,
    // Support and continuous improvement are typically ongoing, so they start as a retainer.
    custom: { type, retainerMonths: type === "support" || type === "continuous_improvement" ? DEFAULT_RETAINER_MONTHS : null },
    hourlyRate: CUSTOM_WORKSTREAM_DEFAULT_RATE,
    items: [],
    sessionComplexity: structuredClone(COMPLEXITY_SOURCE.sessionComplexity),
    setupComplexity: structuredClone(COMPLEXITY_SOURCE.setupComplexity),
  };
}
