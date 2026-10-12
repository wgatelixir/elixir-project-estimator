import type {
  ComplexityTable,
  ElixirSyncIntegrationState,
  ElixirSyncStream,
  EstimationState,
  LocalizedString,
  ProjectPhase,
  StandardLineItem,
  StandardWorkstream,
  ThirdPartyIntegrationState,
  ThirdPartyLineItem,
} from "./types";

const THIRD_PARTY_INTEGRATION_LABEL: LocalizedString = {
  en: "Third Party Integration",
  nl: "Third Party Integration",
};
const ELIXIRSYNC_INTEGRATION_LABEL: LocalizedString = {
  en: "ElixirSync Integration",
  nl: "ElixirSync Integration",
};

function complexityHours(table: ComplexityTable, level: string): number {
  return table[level]?.hours ?? 0;
}

/** Final Effort = Standard Effort + the additional hours for the chosen complexity level. */
export function lineItemFinalEffort(
  item: StandardLineItem,
  workstream: Pick<StandardWorkstream, "sessionComplexity" | "setupComplexity">
): number {
  const table =
    item.complexityTable === "session"
      ? workstream.sessionComplexity
      : workstream.setupComplexity;
  return item.standardEffort + complexityHours(table, item.complexity);
}

export interface WorkstreamTotals {
  key: string;
  label: LocalizedString;
  enabled: boolean;
  phase: ProjectPhase;
  hours: number;
  hourlyRate: number;
  price: number;
  /** This onderdeel's own share of project management, at the estimation's pmPercent/pmRate. */
  pmHours: number;
  pmPrice: number;
}

export function computeStandardWorkstreamTotals(
  ws: StandardWorkstream,
  pmPercent: number,
  pmRate: number
): WorkstreamTotals {
  const hours = ws.enabled
    ? ws.items.reduce(
        (sum, item) => (item.enabled ? sum + lineItemFinalEffort(item, ws) : sum),
        0
      )
    : 0;
  const pmHours = hours * pmPercent;
  return {
    key: ws.key,
    label: ws.label,
    enabled: ws.enabled,
    phase: ws.phase ?? 1,
    hours,
    hourlyRate: ws.hourlyRate,
    price: hours * ws.hourlyRate,
    pmHours,
    pmPrice: pmHours * pmRate,
  };
}

/** Third Party Integration: each line's hours come straight from its own activity-type table. */
export function thirdPartyLineItemHours(
  item: ThirdPartyLineItem,
  state: Pick<ThirdPartyIntegrationState, "sessionComplexity" | "setupComplexity">
): number {
  const table = item.activity === "Session" ? state.sessionComplexity : state.setupComplexity;
  return complexityHours(table, item.complexity);
}

export function computeThirdPartyTotals(
  state: ThirdPartyIntegrationState,
  pmPercent: number,
  pmRate: number
): WorkstreamTotals {
  const hours = state.enabled
    ? state.items.reduce(
        (sum, item) => (item.enabled ? sum + thirdPartyLineItemHours(item, state) : sum),
        0
      )
    : 0;
  const pmHours = hours * pmPercent;
  return {
    key: "third_party_integration",
    label: THIRD_PARTY_INTEGRATION_LABEL,
    enabled: state.enabled,
    phase: state.phase ?? 1,
    hours,
    hourlyRate: state.hourlyRate,
    price: hours * state.hourlyRate,
    pmHours,
    pmPrice: pmHours * pmRate,
  };
}

/** ElixirSync stream total = sum of each item's "Realistic" hours. */
export function elixirSyncStreamHours(stream: ElixirSyncStream): number {
  return stream.items.reduce((sum, item) => sum + item.realistic, 0);
}

export interface ElixirSyncTotals extends WorkstreamTotals {
  /** Realistic hours across every stream, regardless of whether it's checked (informational). */
  allStreamsHours: number;
}

export function computeElixirSyncTotals(
  state: ElixirSyncIntegrationState,
  pmPercent: number,
  pmRate: number
): ElixirSyncTotals {
  const allStreamsHours = state.streams.reduce(
    (sum, stream) => sum + elixirSyncStreamHours(stream),
    0
  );
  const hours = state.enabled
    ? state.streams.reduce(
        (sum, stream) => (stream.included ? sum + elixirSyncStreamHours(stream) : sum),
        0
      )
    : 0;
  const pmHours = hours * pmPercent;
  return {
    key: "elixirsync_integration",
    label: ELIXIRSYNC_INTEGRATION_LABEL,
    enabled: state.enabled,
    phase: state.phase ?? 1,
    hours,
    hourlyRate: state.hourlyRate,
    price: hours * state.hourlyRate,
    pmHours,
    pmPrice: pmHours * pmRate,
    allStreamsHours,
  };
}

export interface SubscriptionTotals {
  label: LocalizedString;
  qty: number;
  unitPrice: number;
  price: number;
}

export interface EstimationTotals {
  workstreams: WorkstreamTotals[];
  thirdParty: WorkstreamTotals;
  elixirSync: ElixirSyncTotals;
  /** Sum of hours across all included workstreams and integrations (before PM). */
  billableHours: number;
  /** Sum of price across all included workstreams and integrations (before PM). */
  billablePrice: number;
  pmHours: number;
  pmPrice: number;
  pmRate: number;
  pmPercent: number;
  totalEffortHours: number;
  totalEffortPrice: number;
  subscriptions: SubscriptionTotals[];
  subscriptionsPrice: number;
  grandTotalPrice: number;
}

export function computeEstimationTotals(state: EstimationState): EstimationTotals {
  const workstreams = state.standardWorkstreams.map((ws) =>
    computeStandardWorkstreamTotals(ws, state.pmPercent, state.pmRate)
  );
  const thirdParty = computeThirdPartyTotals(state.thirdPartyIntegration, state.pmPercent, state.pmRate);
  const elixirSync = computeElixirSyncTotals(state.elixirSyncIntegration, state.pmPercent, state.pmRate);

  const billableHours =
    workstreams.reduce((sum, w) => sum + w.hours, 0) + thirdParty.hours + elixirSync.hours;
  const billablePrice =
    workstreams.reduce((sum, w) => sum + w.price, 0) + thirdParty.price + elixirSync.price;

  // Project management is computed per onderdeel above (so each tab/Overview row can show its
  // own share) and summed here - equivalent to billableHours * pmPercent since pmPercent/pmRate
  // are uniform across onderdelen, but structured so the breakdown and the total always agree.
  const pmHours = workstreams.reduce((sum, w) => sum + w.pmHours, 0) + thirdParty.pmHours + elixirSync.pmHours;
  const pmPrice = workstreams.reduce((sum, w) => sum + w.pmPrice, 0) + thirdParty.pmPrice + elixirSync.pmPrice;

  const totalEffortHours = billableHours + pmHours;
  const totalEffortPrice = billablePrice + pmPrice;

  const subscriptions: SubscriptionTotals[] = [
    {
      label: { en: "ElixirSync Integration Subscription", nl: "ElixirSync Integration abonnement" },
      qty: state.elixirSyncIntegration.subscriptionQty,
      unitPrice: state.elixirSyncIntegration.subscriptionUnitPrice,
      price:
        state.elixirSyncIntegration.subscriptionQty *
        state.elixirSyncIntegration.subscriptionUnitPrice,
    },
    {
      label: { en: "Third Party Integration Subscription", nl: "Third Party Integration abonnement" },
      qty: state.thirdPartyIntegration.subscriptionQty,
      unitPrice: state.thirdPartyIntegration.subscriptionUnitPrice,
      price:
        state.thirdPartyIntegration.subscriptionQty *
        state.thirdPartyIntegration.subscriptionUnitPrice,
    },
  ];
  const subscriptionsPrice = subscriptions.reduce((sum, s) => sum + s.price, 0);

  return {
    workstreams,
    thirdParty,
    elixirSync,
    billableHours,
    billablePrice,
    pmHours,
    pmPrice,
    pmRate: state.pmRate,
    pmPercent: state.pmPercent,
    totalEffortHours,
    totalEffortPrice,
    subscriptions,
    subscriptionsPrice,
    grandTotalPrice: totalEffortPrice + subscriptionsPrice,
  };
}

export interface PhaseGroup {
  phase: ProjectPhase;
  rows: WorkstreamTotals[];
  /** Implementation + PM, the same basis as the per-onderdeel Total (incl. PM) rows. */
  hours: number;
  price: number;
}

/**
 * Every included onderdeel (standard workstreams, then the integrations),
 * grouped by delivery phase in phase order. `showPhases` is false when
 * everything sits in one phase, so views can skip phase headings that
 * would only repeat "Phase 1".
 */
export function groupByPhase(totals: EstimationTotals): { groups: PhaseGroup[]; showPhases: boolean } {
  const onderdelen = [
    ...totals.workstreams.filter((w) => w.enabled),
    ...(totals.thirdParty.enabled ? [totals.thirdParty] : []),
    ...(totals.elixirSync.enabled ? [totals.elixirSync] : []),
  ];
  const groups = ([1, 2, 3] as const)
    .map((phase) => {
      const rows = onderdelen.filter((w) => w.phase === phase);
      return {
        phase,
        rows,
        hours: rows.reduce((sum, w) => sum + w.hours + w.pmHours, 0),
        price: rows.reduce((sum, w) => sum + w.price + w.pmPrice, 0),
      };
    })
    .filter((group) => group.rows.length > 0);
  return { groups, showPhases: groups.length > 1 };
}
