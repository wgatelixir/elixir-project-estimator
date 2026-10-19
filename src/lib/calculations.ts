import type {
  ComplexityTable,
  ElixirSyncIntegrationState,
  ElixirSyncStream,
  EstimationState,
  DealStage,
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

/** The rate a line is priced at: its own, or else the workstream's. */
export function lineItemRate(item: StandardLineItem, workstream: Pick<StandardWorkstream, "hourlyRate">): number {
  return item.hourlyRate ?? workstream.hourlyRate;
}

/** One line's price for one month (or the whole job, for one-off work). */
export function lineItemPrice(
  item: StandardLineItem,
  workstream: Pick<StandardWorkstream, "sessionComplexity" | "setupComplexity" | "hourlyRate">
): number {
  return lineItemFinalEffort(item, workstream) * lineItemRate(item, workstream);
}

/** null = no phase ("n.v.t."); a missing value is phase 1 (saved before phases existed). */
export function resolvePhase(phase: ProjectPhase | null | undefined): ProjectPhase | null {
  return phase === undefined ? 1 : phase;
}

export interface WorkstreamTotals {
  key: string;
  label: LocalizedString;
  enabled: boolean;
  phase: ProjectPhase | null;
  stage: DealStage;
  hours: number;
  /** The workstream's rate - or, when lines carry their own rates, the effective (blended) rate: price / hours. */
  hourlyRate: number;
  price: number;
  /** This onderdeel's own share of project management, at the estimation's pmPercent/pmRate. */
  pmHours: number;
  pmPrice: number;
  /** Set for a monthly retainer: hours/price above are the totals over all months. */
  retainer?: { months: number; monthlyHours: number; monthlyPrice: number };
}

/** Months a workstream's line hours are multiplied by: the retainer length, or 1 for one-off work. */
export function workstreamMonths(ws: Pick<StandardWorkstream, "custom">): number {
  const months = ws.custom?.retainerMonths;
  return months && months > 0 ? months : 1;
}

export function computeStandardWorkstreamTotals(
  ws: StandardWorkstream,
  pmPercent: number,
  pmRate: number
): WorkstreamTotals {
  const lines = ws.enabled ? ws.items.filter((item) => item.enabled) : [];
  const monthlyHours = lines.reduce((sum, item) => sum + lineItemFinalEffort(item, ws), 0);
  const monthlyPrice = lines.reduce((sum, item) => sum + lineItemPrice(item, ws), 0);
  const hasLineRates = lines.some((item) => item.hourlyRate != null && item.hourlyRate !== ws.hourlyRate);
  const months = workstreamMonths(ws);
  const hours = monthlyHours * months;
  const pmHours = hours * pmPercent;
  return {
    key: ws.key,
    label: ws.label,
    enabled: ws.enabled,
    phase: resolvePhase(ws.phase),
    stage: ws.stage ?? "proposal",
    hours,
    hourlyRate: hasLineRates && monthlyHours > 0 ? monthlyPrice / monthlyHours : ws.hourlyRate,
    price: monthlyPrice * months,
    pmHours,
    pmPrice: pmHours * pmRate,
    ...(ws.custom?.retainerMonths ? { retainer: { months, monthlyHours, monthlyPrice } } : {}),
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
    phase: resolvePhase(state.phase),
    stage: state.stage ?? "proposal",
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
    phase: resolvePhase(state.phase),
    stage: state.stage ?? "proposal",
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
  phase: ProjectPhase | null;
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
  // Onderdelen without a phase ("n.v.t.") come last, as their own group.
  const groups = ([1, 2, 3, null] as const)
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

export interface StageTotals {
  hours: number;
  /** Implementation + PM + the subscriptions of integrations in this stage. */
  price: number;
}

/**
 * Splits the grand total by sales stage, for the forecast: what's already won
 * and what is still proposed. Every included onderdeel counts with its PM; an
 * integration's subscription follows that integration's stage. The two prices
 * always add up to grandTotalPrice.
 */
export function totalsByStage(totals: EstimationTotals): Record<DealStage, StageTotals> {
  const result: Record<DealStage, StageTotals> = {
    proposal: { hours: 0, price: 0 },
    closed_won: { hours: 0, price: 0 },
  };
  const onderdelen = [...totals.workstreams, totals.thirdParty, totals.elixirSync].filter((w) => w.enabled);
  for (const w of onderdelen) {
    result[w.stage].hours += w.hours + w.pmHours;
    result[w.stage].price += w.price + w.pmPrice;
  }
  const [elixirSyncSubscription, thirdPartySubscription] = totals.subscriptions;
  result[totals.elixirSync.stage].price += elixirSyncSubscription?.price ?? 0;
  result[totals.thirdParty.stage].price += thirdPartySubscription?.price ?? 0;
  return result;
}
