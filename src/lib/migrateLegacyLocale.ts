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

import { STANDARD_WORKSTREAM_TEMPLATES, THIRD_PARTY_INTEGRATION_TEMPLATE } from "./templates";
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

function localize(current: LocalizedString | string, canonical: LocalizedString | null | undefined): LocalizedString {
  if (typeof current !== "string") return current;
  if (canonical && canonical.en === current) return canonical;
  return { en: current, nl: current };
}

function localizeNullable(
  current: LocalizedString | string | null | undefined,
  canonical: LocalizedString | null | undefined
): LocalizedString | null {
  if (current == null) return null;
  return localize(current, canonical);
}

function migrateComplexityTable(table: ComplexityTable, canonical: ComplexityTable | undefined): ComplexityTable {
  const result: ComplexityTable = {};
  for (const [level, entry] of Object.entries(table)) {
    result[level] = { ...entry, comment: localizeNullable(entry.comment, canonical?.[level]?.comment) };
  }
  return result;
}

function migrateStandardItem(item: StandardLineItem, canonicalItems: Map<string, StandardLineItem>): StandardLineItem {
  const canonical = canonicalItems.get(item.id);
  return {
    ...item,
    topic: localize(item.topic, canonical?.topic),
    comment: localizeNullable(item.comment, canonical?.comment),
  };
}

function migrateWorkstream(ws: StandardWorkstream): StandardWorkstream {
  const canonical = CANONICAL_WORKSTREAM_BY_KEY.get(ws.key);
  const canonicalItems = new Map((canonical?.items ?? []).map((item) => [item.id, item]));
  return {
    ...ws,
    label: localize(ws.label, canonical?.label),
    items: ws.items.map((item) => migrateStandardItem(item, canonicalItems)),
    sessionComplexity: migrateComplexityTable(ws.sessionComplexity, canonical?.sessionComplexity),
    setupComplexity: migrateComplexityTable(ws.setupComplexity, canonical?.setupComplexity),
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
