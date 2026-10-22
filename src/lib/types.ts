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
export type LineActivityType =
  | "Session"
  | "Session Prep"
  | "Setup"
  | "Risk Buffer"
  | "Desk work"
  // Service activities, offered in client-specific workstreams.
  | "Consulting"
  | "Development"
  | "Support";

export interface StandardLineItem {
  id: string;
  activity: LineActivityType;
  topic: LocalizedString;
  /** Session length in hours (the sheet's "Duration" column) - informational, not used in totals. */
  duration?: number | null;
  standardEffort: number;
  /**
   * This line's own hourly rate; missing/null = the workstream's rate. Lets a
   * client-specific workstream price consulting, development and support differently.
   */
  hourlyRate?: number | null;
  /** Which of the workstream's two complexity tables this line's dropdown looks up. */
  complexityTable: "session" | "setup";
  /** Key into that table (e.g. "Standard", "High"). */
  complexity: string;
  /**
   * The Session line this line belongs to (e.g. a Session Prep line's session).
   * Switching that session on/off switches this line with it; this line can still be
   * toggled on its own afterwards. `null` = deliberately unlinked; missing = take the
   * template's link (estimations saved before links existed).
   */
  linkedTo?: string | null;
  comment?: LocalizedString | null;
  /** Unchecked lines are kept (for re-enabling) but excluded from totals. */
  enabled: boolean;
  /**
   * Overrides the workstream's own phase for this one line (e.g. one session
   * of a workstream delivered in phase 1, another in phase 2). Missing =
   * inherit the workstream's phase; `null` = this line explicitly has no
   * phase, regardless of the workstream's.
   */
  phase?: ProjectPhase | null;
}

/**
 * Which delivery phase an onderdeel is planned in. On the state, `null` means
 * "not applicable" (no phase) and a missing value means phase 1 (estimations
 * saved before phases existed).
 */
export type ProjectPhase = 1 | 2 | 3;

/**
 * Sales stage of an onderdeel: still being proposed (counts toward the forecast)
 * or already won. Missing = "proposal" (estimations saved before stages existed).
 */
export type DealStage = "proposal" | "closed_won";

export type CustomWorkstreamType = "support" | "change_requests" | "continuous_improvement" | "other";

/** Present only on workstreams the user created on the Cover page (not from the template). */
export interface CustomWorkstreamSettings {
  type: CustomWorkstreamType;
  /**
   * null = one-off, priced like any other workstream. A number = a monthly
   * retainer for that many months: the line hours are per month, and the
   * workstream's hours and price are the monthly figures times the months.
   */
  retainerMonths: number | null;
}

export interface StandardWorkstream {
  key: string;
  label: LocalizedString;
  phase?: ProjectPhase | null;
  stage?: DealStage;
  custom?: CustomWorkstreamSettings;
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
  phase?: ProjectPhase | null;
  stage?: DealStage;
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
  phase?: ProjectPhase | null;
  stage?: DealStage;
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
  /**
   * The Cover page's bulk-apply rate for implementation work: typing a new
   * value here updates every standard workstream, Third Party Integration
   * and ElixirSync Integration whose hourlyRate still equals the current
   * serviceRate, so one field can reprice a whole estimation's "everything
   * except PM" in one go. Onderdelen already set to a different (manually
   * overridden) rate are left alone - still editable individually per tab.
   */
  serviceRate: number;
  hubspotLicense: HubSpotLicenseState;
}

export type EstimationStatus = "DRAFT" | "FINAL";

/** HubSpot's standard Sales Pipeline deal stages, in order. */
export type OpportunityPhase =
  | "QUALIFIED_TO_BUY"
  | "DEMO_SCHEDULED"
  | "PROPOSAL_SENT"
  | "DECISION_MAKER_BOUGHT_IN"
  | "CONTRACT_SENT"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export const OPPORTUNITY_PHASES: OpportunityPhase[] = [
  "QUALIFIED_TO_BUY",
  "DEMO_SCHEDULED",
  "PROPOSAL_SENT",
  "DECISION_MAKER_BOUGHT_IN",
  "CONTRACT_SENT",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export interface EstimationSummary {
  id: string;
  clientName: string;
  projectName: string | null;
  ownerName: string | null;
  status: EstimationStatus;
  opportunityPhase: OpportunityPhase;
  /**
   * Stored independently of opportunityPhase, not derived from it - a deal
   * can be flagged Closed Won here without opportunityPhase also being set
   * to CLOSED_WON, and vice versa. Set both if you want them to agree.
   */
  closedWon: boolean;
  /** Target/deadline date tied to the Closed Won flag above. */
  closedWonDeadline: string | null;
  totalHours: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface EstimationRecord extends EstimationSummary {
  data: EstimationState;
}

/** A read-only snapshot taken every time an estimation is created or saved - see EstimationVersion in prisma/schema.prisma. */
export interface EstimationVersionSummary {
  id: string;
  estimationId: string;
  /** 1, 2, 3... in save order for this estimation - shown as "v1", "v2". */
  versionNumber: number;
  clientName: string;
  projectName: string | null;
  ownerName: string | null;
  status: EstimationStatus;
  opportunityPhase: OpportunityPhase;
  closedWon: boolean;
  closedWonDeadline: string | null;
  totalHours: number;
  totalPrice: number;
  /** Set only when this snapshot was created by restoring an earlier one. */
  note: string | null;
  createdAt: string;
}

export interface EstimationVersionRecord extends EstimationVersionSummary {
  data: EstimationState;
}
