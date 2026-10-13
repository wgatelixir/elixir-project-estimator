// Links between line items within a workstream: a Session Prep line points at
// the Session it prepares (`linkedTo`). Switching the session on or off takes
// its linked lines with it; a linked line can still be switched on its own
// afterwards, so the link is a convenience, never a lock.

import { STANDARD_WORKSTREAM_TEMPLATES } from "./templates";
import type { EstimationState, StandardWorkstream } from "./types";

const TEMPLATE_LINKS = new Map(
  STANDARD_WORKSTREAM_TEMPLATES.flatMap((ws) =>
    ws.items.filter((item) => item.linkedTo).map((item) => [item.id, item.linkedTo as string] as const)
  )
);

/**
 * Estimations saved before links existed have no `linkedTo` at all. Give their
 * template lines the template's link, as long as the linked session is still in
 * the workstream. An explicit `null` (the user unlinked it) is left alone.
 */
export function backfillTemplateLinks(state: EstimationState): EstimationState {
  return {
    ...state,
    standardWorkstreams: state.standardWorkstreams.map((ws) => {
      const ids = new Set(ws.items.map((item) => item.id));
      return {
        ...ws,
        items: ws.items.map((item) => {
          if (item.linkedTo !== undefined) return item;
          const link = TEMPLATE_LINKS.get(item.id);
          return link && ids.has(link) ? { ...item, linkedTo: link } : item;
        }),
      };
    }),
  };
}

/** Switches a line on/off; for a Session, its linked lines follow. */
export function setLineEnabled(ws: StandardWorkstream, id: string, enabled: boolean): StandardWorkstream {
  const isSession = ws.items.some((item) => item.id === id && item.activity === "Session");
  return {
    ...ws,
    items: ws.items.map((item) =>
      item.id === id || (isSession && item.linkedTo === id) ? { ...item, enabled } : item
    ),
  };
}

/** Removes a line; lines that were linked to it stay, but unlinked. */
export function removeLine(ws: StandardWorkstream, id: string): StandardWorkstream {
  return {
    ...ws,
    items: ws.items
      .filter((item) => item.id !== id)
      .map((item) => (item.linkedTo === id ? { ...item, linkedTo: null } : item)),
  };
}
