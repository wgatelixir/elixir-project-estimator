// Shared shape for an estimation's editable state. Persisted as JSON on the
// Estimation.data column (see prisma/schema.prisma) and used directly by the UI.

export type Locale = "en" | "nl";

/** English/Dutch pair for any piece of client-facing content (topic, label, comment). */
export interface LocalizedString {
  en: string;
  nl: string;
}

export interface ComplexityTableEntry {
  hours: number;
  comment?: LocalizedString | null;
}

// Keyed by the complexity level's display label (e.g. "Standard", "High complexity").
export type ComplexityTable = Record<string, ComplexityTableEntry>;

// "Desk work" only exists on estimations created from the V2 template; V3 uses
// "Session Prep" for session preparation and "Risk Buffer" for contingency lines.
export type LineActivityType = "Session" | "Session Prep" | "Setup" | "Risk Buffer" | "Desk work";

export interface StandardLineItem {
  id: string;
  activity: LineActivityType;
  topic: LocalizedString;
  /** Session length in hours (the sheet's "Duration" column) - informational, not used in totals. */
  duration?: number | null;
  standardEffort: number;
  /** Which of the workstream's two complexity tables this line's dropdown looks up. */
  complexityTable: "session" | "setup";
  /** Key into that table (e.g. "Standard", "High"). */
  complexity: string;
  comment?: LocalizedString | null;
  /** Unchecked lines are kept (for re-enabling) but excluded from totals. */
  enabled: boolean;
}

export interface StandardWorkstream {
  key: string;
  label: LocalizedString;
  /** A disabled workstream contributes 0 hours/price and is collapsed in the UI. */
  enabled: boolean;
  hourlyRate: number;
  items: StandardLineItem[];
  sessionComplexity: ComplexityTable;
  setupComplexity: ComplexityTable;
}

export type ThirdPartyActivityType = "Session" | "Setup";

export interface ThirdPartyLineItem {
  id: string;
  activity: ThirdPartyActivityType;
  topic: LocalizedString;
  from?: string | null;
  to?: string | null;
  complexity: string;
  enabled: boolean;
}

export interface ThirdPartyIntegrationState {
  enabled: boolean;
  hourlyRate: number;
  items: ThirdPartyLineItem[];
  sessionComplexity: ComplexityTable;
  setupComplexity: ComplexityTable;
  subscriptionQty: number;
  subscriptionUnitPrice: number;
}

export interface ElixirSyncLineItem {
  id: string;
  label: string;
  optimistic: number;
  pessimistic: number;
  realistic: number;
}

export interface ElixirSyncStream {
  id: string;
  label: string;
  /** Mirrors the "What do you need?" checkbox column in the source sheet. */
  included: boolean;
  items: ElixirSyncLineItem[];
}

export interface ElixirSyncIntegrationState {
  enabled: boolean;
  hourlyRate: number;
  streams: ElixirSyncStream[];
  subscriptionQty: number;
  subscriptionUnitPrice: number;
}

export type HubSpotEdition = "starter" | "professional" | "enterprise";

/**
 * Whether HubSpot's new EMEA Seats-and-Credits pricing even applies to this
 * deal - the source material calls getting this wrong "the most common
 * mistake". `null` = not yet determined; the panel won't claim an answer
 * either way until the user has actually checked.
 */
export interface HubSpotLicenseApplicability {
  newEmeaCustomerSinceOct2026: boolean | null;
  existingHubSpotCustomer: boolean | null;
  beneluxOrNordicsPilot: boolean | null;
  newPortalUnderExistingMultiPortal: boolean | null;
}

/**
 * HubSpot's own software subscription cost (seats + credits), kept entirely
 * separate from the Elixir implementation-services estimate above - this
 * pricing is maintained by HubSpot, changes on its own schedule, and must
 * never be silently folded into Elixir's hours x rate totals.
 */
export interface HubSpotLicenseState {
  enabled: boolean;
  applicability: HubSpotLicenseApplicability;
  edition: HubSpotEdition;
  gtmSeats: number;
  opsSeats: number;
  /** Price not published in the source material - tracked for completeness, excluded from the total. */
  viewOnlySeats: number;
  expectedRecords: number;
  expectedEmailsPerMonth: number;
  expectedCreditsPerMonth: number;
  notes: string;
}

export interface EstimationState {
  /** Drives both the editor UI language and the Proposal Summary/PDF - a client-facing proposal should read in the client's language. */
  locale: Locale;
  standardWorkstreams: StandardWorkstream[];
  thirdPartyIntegration: ThirdPartyIntegrationState;
  elixirSyncIntegration: ElixirSyncIntegrationState;
  pmRate: number;
  pmPercent: number;
  hubspotLicense: HubSpotLicenseState;
}

export type EstimationStatus = "DRAFT" | "FINAL";

export interface EstimationSummary {
  id: string;
  clientName: string;
  projectName: string | null;
  ownerName: string | null;
  status: EstimationStatus;
  totalHours: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface EstimationRecord extends EstimationSummary {
  data: EstimationState;
}
