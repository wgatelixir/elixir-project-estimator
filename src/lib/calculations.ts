import type {
  ComplexityTable,
  ElixirSyncIntegrationState,
  ElixirSyncStream,
  EstimationState,
  StandardLineItem,
  StandardWorkstream,
  ThirdPartyIntegrationState,
  ThirdPartyLineItem,
} from "./types";

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
  label: string;
  enabled: boolean;
  hours: number;
  hourlyRate: number;
  price: number;
}

export function computeStandardWorkstreamTotals(ws: StandardWorkstream): WorkstreamTotals {
  const hours = ws.enabled
    ? ws.items.reduce(
        (sum, item) => (item.enabled ? sum + lineItemFinalEffort(item, ws) : sum),
        0
      )
    : 0;
  return {
    key: ws.key,
    label: ws.label,
    enabled: ws.enabled,
    hours,
    hourlyRate: ws.hourlyRate,
    price: hours * ws.hourlyRate,
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

export function computeThirdPartyTotals(state: ThirdPartyIntegrationState): WorkstreamTotals {
  const hours = state.enabled
    ? state.items.reduce(
        (sum, item) => (item.enabled ? sum + thirdPartyLineItemHours(item, state) : sum),
        0
      )
    : 0;
  return {
    key: "third_party_integration",
    label: "Third Party Integration",
    enabled: state.enabled,
    hours,
    hourlyRate: state.hourlyRate,
    price: hours * state.hourlyRate,
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

export function computeElixirSyncTotals(state: ElixirSyncIntegrationState): ElixirSyncTotals {
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
  return {
    key: "elixirsync_integration",
    label: "ElixirSync Integration",
    enabled: state.enabled,
    hours,
    hourlyRate: state.hourlyRate,
    price: hours * state.hourlyRate,
    allStreamsHours,
  };
}

export interface SubscriptionTotals {
  label: string;
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
  const workstreams = state.standardWorkstreams.map(computeStandardWorkstreamTotals);
  const thirdParty = computeThirdPartyTotals(state.thirdPartyIntegration);
  const elixirSync = computeElixirSyncTotals(state.elixirSyncIntegration);

  const billableHours =
    workstreams.reduce((sum, w) => sum + w.hours, 0) + thirdParty.hours + elixirSync.hours;
  const billablePrice =
    workstreams.reduce((sum, w) => sum + w.price, 0) + thirdParty.price + elixirSync.price;

  const pmHours = billableHours * state.pmPercent;
  const pmPrice = pmHours * state.pmRate;

  const totalEffortHours = billableHours + pmHours;
  const totalEffortPrice = billablePrice + pmPrice;

  const subscriptions: SubscriptionTotals[] = [
    {
      label: "ElixirSync Integration Subscription",
      qty: state.elixirSyncIntegration.subscriptionQty,
      unitPrice: state.elixirSyncIntegration.subscriptionUnitPrice,
      price:
        state.elixirSyncIntegration.subscriptionQty *
        state.elixirSyncIntegration.subscriptionUnitPrice,
    },
    {
      label: "Third Party Integration Subscription",
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
