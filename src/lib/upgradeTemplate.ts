// Brings an estimation created from the V2 template up to the current (V3)
// template, on request. Saved estimations are frozen snapshots - possibly
// already sent to a client - so this never runs automatically: the editor
// offers it per estimation, applies it to the unsaved editor state, and the
// user reviews the result before saving.
//
// What it keeps from the old estimation:
// - per workstream: whether it's included, its hourly rate, its complexity tables
// - per line that exists in both templates (same id): enabled + complexity, and
//   the topic / standard effort only if the user had changed them from V2's
// - every line the user added themselves (ids that were never in the V2 template)
// - Third Party, ElixirSync, PM and HubSpot license settings (V3 didn't change
//   their line items)
// Template lines V3 dropped are removed; V3's new lines are added at their
// V3 defaults. The HubSpot Deployment & Go-Live workstream goes away (V3 moved
// its trainings and go-live into each hub tab) unless it holds the user's own lines.

import { STANDARD_WORKSTREAM_TEMPLATES } from "./templates";
import { LEGACY_V2_ITEM_DEFAULTS } from "./legacyTemplatesV2";
import type { EstimationState, StandardLineItem, StandardWorkstream } from "./types";

const LEGACY_ONLY_WORKSTREAM_KEY = "deployment_golive";

const isCustomLine = (item: StandardLineItem) => !(item.id in LEGACY_V2_ITEM_DEFAULTS);

const CURRENT_TEMPLATE_IDS = new Set(STANDARD_WORKSTREAM_TEMPLATES.flatMap((ws) => ws.items.map((item) => item.id)));

/**
 * True while the estimation still holds a V2 template line that V3 dropped (e.g.
 * Business Assessment's solution design workshop, or any Deployment & Go-Live line).
 * Every V2 estimation starts with those; an upgraded or V3 estimation has none.
 */
export function isLegacyTemplate(state: EstimationState): boolean {
  return state.standardWorkstreams.some((ws) =>
    ws.items.some((item) => !isCustomLine(item) && !CURRENT_TEMPLATE_IDS.has(item.id))
  );
}

function upgradeItem(v3: StandardLineItem, old: StandardLineItem | undefined, ws: StandardWorkstream): StandardLineItem {
  const fresh = structuredClone(v3);
  if (!old) return fresh;
  const v2 = LEGACY_V2_ITEM_DEFAULTS[old.id];
  const table = fresh.complexityTable === "session" ? ws.sessionComplexity : ws.setupComplexity;
  return {
    ...fresh,
    topic: v2 && old.topic.en !== v2.topicEn ? old.topic : fresh.topic,
    standardEffort: v2 && old.standardEffort !== v2.standardEffort ? old.standardEffort : fresh.standardEffort,
    complexity: old.complexity in table ? old.complexity : fresh.complexity,
    enabled: old.enabled,
  };
}

function upgradeWorkstream(template: StandardWorkstream, old: StandardWorkstream | undefined): StandardWorkstream {
  if (!old) return structuredClone(template);
  const oldById = new Map(old.items.map((item) => [item.id, item]));
  const templateIds = new Set(template.items.map((item) => item.id));
  return {
    ...old,
    label: structuredClone(template.label),
    items: [
      ...template.items.map((v3) => upgradeItem(v3, oldById.get(v3.id), old)),
      ...old.items.filter((item) => isCustomLine(item) && !templateIds.has(item.id)),
    ],
  };
}

export function upgradeToCurrentTemplate(state: EstimationState): EstimationState {
  const oldByKey = new Map(state.standardWorkstreams.map((ws) => [ws.key, ws]));
  const upgraded = STANDARD_WORKSTREAM_TEMPLATES.map((template) => upgradeWorkstream(template, oldByKey.get(template.key)));

  const templateKeys = new Set(STANDARD_WORKSTREAM_TEMPLATES.map((ws) => ws.key));
  const leftovers = state.standardWorkstreams
    .filter((ws) => !templateKeys.has(ws.key))
    .map((ws) => ({ ...ws, items: ws.items.filter(isCustomLine) }))
    .filter((ws) => ws.items.length > 0 || ws.key !== LEGACY_ONLY_WORKSTREAM_KEY);

  return { ...state, standardWorkstreams: [...upgraded, ...leftovers] };
}
