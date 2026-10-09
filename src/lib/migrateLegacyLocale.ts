// Estimations saved before bilingual support existed have `topic` / `label` /
// `comment` stored as plain strings rather than { en, nl } pairs. Simply
// duplicating that string into both locale slots "fixes" the blank-text bug
// but silently loses the real Dutch translation for any untouched template
// content - NL mode would then just show the English text back.
//
// Instead, for each field we look up the canonical bilingual value from the
// seed templates (matched by the line item's stable `id`, or the
// workstream's `key`) and use it IF the saved English text still matches
// the template's English text exactly - meaning this is untouched template
// content, so the template's Dutch translation is known to be correct for
// it. If the text doesn't match (the user edited it) or there's no
// canonical counterpart (a custom-added line), we fall back to duplicating
// the saved string so the user's own content is preserved rather than
// overwritten with an unrelated translation.
//
// Legacy estimations were all created from the V2 template, so content the V3
// template dropped (removed line items, the HubSpot Deployment & Go-Live
// workstream) is looked up in legacyTemplatesV2.ts instead.

import { STANDARD_WORKSTREAM_TEMPLATES, THIRD_PARTY_INTEGRATION_TEMPLATE } from "./templates";
import { LEGACY_V2_ITEM_TEXT, LEGACY_V2_WORKSTREAM_TEXT } from "./legacyTemplatesV2";
import type {
  ComplexityTable,
  EstimationState,
  LocalizedString,
  StandardLineItem,
  StandardWorkstream,
  ThirdPartyIntegrationState,
  ThirdPartyLineItem,
} from "./types";

const CANONICAL_WORKSTREAM_BY_KEY = new Map(STANDARD_WORKSTREAM_TEMPLATES.map((ws) => [ws.key, ws]));
const CANONICAL_THIRD_PARTY_ITEM_BY_ID = new Map(THIRD_PARTY_INTEGRATION_TEMPLATE.items.map((item) => [item.id, item]));

type Candidate = LocalizedString | null | undefined;

/** The first candidate whose English text matches wins, so the current template takes precedence over V2. */
function localize(current: LocalizedString | string, ...candidates: Candidate[]): LocalizedString {
  if (typeof current !== "string") return current;
  const match = candidates.find((c) => c && c.en === current);
  return match ?? { en: current, nl: current };
}

function localizeNullable(
  current: LocalizedString | string | null | undefined,
  ...candidates: Candidate[]
): LocalizedString | null {
  if (current == null) return null;
  return localize(current, ...candidates);
}

function migrateComplexityTable(
  table: ComplexityTable,
  canonical: ComplexityTable | undefined,
  legacy?: Record<string, LocalizedString | null>
): ComplexityTable {
  const result: ComplexityTable = {};
  for (const [level, entry] of Object.entries(table)) {
    result[level] = { ...entry, comment: localizeNullable(entry.comment, canonical?.[level]?.comment, legacy?.[level]) };
  }
  return result;
}

function migrateStandardItem(item: StandardLineItem, canonicalItems: Map<string, StandardLineItem>): StandardLineItem {
  const canonical = canonicalItems.get(item.id);
  const legacy = LEGACY_V2_ITEM_TEXT[item.id];
  return {
    ...item,
    topic: localize(item.topic, canonical?.topic, legacy?.topic),
    comment: localizeNullable(item.comment, canonical?.comment, legacy?.comment),
  };
}

function migrateWorkstream(ws: StandardWorkstream): StandardWorkstream {
  const canonical = CANONICAL_WORKSTREAM_BY_KEY.get(ws.key);
  const legacy = LEGACY_V2_WORKSTREAM_TEXT[ws.key];
  const canonicalItems = new Map((canonical?.items ?? []).map((item) => [item.id, item]));
  return {
    ...ws,
    label: localize(ws.label, canonical?.label, legacy?.label),
    items: ws.items.map((item) => migrateStandardItem(item, canonicalItems)),
    sessionComplexity: migrateComplexityTable(ws.sessionComplexity, canonical?.sessionComplexity, legacy?.sessionComplexity),
    setupComplexity: migrateComplexityTable(ws.setupComplexity, canonical?.setupComplexity, legacy?.setupComplexity),
  };
}

function migrateThirdPartyItem(item: ThirdPartyLineItem): ThirdPartyLineItem {
  const canonical = CANONICAL_THIRD_PARTY_ITEM_BY_ID.get(item.id);
  return { ...item, topic: localize(item.topic, canonical?.topic) };
}

function migrateThirdParty(tp: ThirdPartyIntegrationState): ThirdPartyIntegrationState {
  return {
    ...tp,
    items: tp.items.map(migrateThirdPartyItem),
    sessionComplexity: migrateComplexityTable(tp.sessionComplexity, THIRD_PARTY_INTEGRATION_TEMPLATE.sessionComplexity),
    setupComplexity: migrateComplexityTable(tp.setupComplexity, THIRD_PARTY_INTEGRATION_TEMPLATE.setupComplexity),
  };
}

/** Safe to run unconditionally on every load - a no-op on already-bilingual data. */
export function migrateLegacyLocaleFields(data: EstimationState): EstimationState {
  return {
    ...data,
    standardWorkstreams: data.standardWorkstreams.map(migrateWorkstream),
    thirdPartyIntegration: migrateThirdParty(data.thirdPartyIntegration),
  };
}
