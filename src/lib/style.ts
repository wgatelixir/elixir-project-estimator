// Shared color coding for complexity levels and activity types, used by
// both the interactive editor panels (colored <select>/badges) and the
// read-only proposal summary (static pills) so the two stay visually
// consistent.

import type { ComplexityTable, LocalizedString, OpportunityPhase } from "./types";

export type ComplexityBand = "low" | "standard" | "medium" | "high" | "na";

/** Classifies any of the source sheets' level labels ("Low", "High complexity", "N/A", ...). */
export function classifyComplexity(level: string): ComplexityBand {
  const l = level.toLowerCase();
  if (l.startsWith("low")) return "low";
  if (l.startsWith("standard")) return "standard";
  if (l.startsWith("medium")) return "medium";
  if (l.startsWith("high")) return "high";
  return "na";
}

interface ComplexityStyle {
  badge: string;
  select: string;
  dot: string;
  label: LocalizedString;
}

export const COMPLEXITY_STYLES: Record<ComplexityBand, ComplexityStyle> = {
  low: {
    badge: "bg-sky-50 text-sky-700 border border-sky-200",
    select: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-400",
    label: { en: "Low", nl: "Laag" },
  },
  standard: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    select: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-400",
    label: { en: "Standard", nl: "Standaard" },
  },
  medium: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    select: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    label: { en: "Medium", nl: "Gemiddeld" },
  },
  high: {
    badge: "bg-brand-crimson/10 text-brand-crimson border border-brand-crimson/30",
    select: "bg-brand-crimson/10 text-brand-crimson border-brand-crimson/30",
    dot: "bg-brand-crimson",
    label: { en: "High", nl: "Hoog" },
  },
  na: {
    badge: "bg-slate-100 text-slate-500 border border-slate-200",
    select: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-300",
    label: { en: "N/A", nl: "N.v.t." },
  },
};

export const COMPLEXITY_LEGEND: ComplexityBand[] = ["low", "standard", "medium", "high"];
export const COMPLEXITY_LEGEND_THIRD_PARTY: ComplexityBand[] = ["na", "low", "medium", "high"];

/** Maps a workstream/integration's own complexity table to the +/- hours delta per band, for the legend. */
export function complexityHoursByBand(table: ComplexityTable): Partial<Record<ComplexityBand, number>> {
  const result: Partial<Record<ComplexityBand, number>> = {};
  for (const [level, entry] of Object.entries(table)) {
    result[classifyComplexity(level)] = entry.hours;
  }
  return result;
}

/**
 * Maps a complexity table to the source spreadsheet's own "Comment" text per
 * band (e.g. "3 hr Session with 2 people, high complexity and high
 * preparation time"). Only the Session table carries these in the original
 * sheet - Setup rows share the same levels but were left uncommented there -
 * so callers should read this from a Session table even when describing
 * Setup rows too. Entries without a comment (nulls) are omitted so callers
 * can fall back to COMPLEXITY_DESCRIPTIONS.
 */
export function complexityCommentsByBand(table: ComplexityTable): Partial<Record<ComplexityBand, LocalizedString>> {
  const result: Partial<Record<ComplexityBand, LocalizedString>> = {};
  for (const [level, entry] of Object.entries(table)) {
    if (entry.comment) result[classifyComplexity(level)] = entry.comment;
  }
  return result;
}

/**
 * Generic fallback wording for each complexity level, used only when a
 * workstream/integration's own table has no Comment text for that band.
 * Two variants because the meaning genuinely differs: standard workstreams
 * describe session/setup prep time, while Third Party Integration describes
 * integration-flow risk (and has no "Standard" level, only N/A/Low/Medium/High).
 */
export const COMPLEXITY_DESCRIPTIONS: Record<
  "standard" | "thirdParty",
  Partial<Record<ComplexityBand, LocalizedString>>
> = {
  standard: {
    low: { en: "Less prep than usual — a quick, simple session or setup.", nl: "Minder voorbereiding dan normaal — een korte, eenvoudige sessie of setup." },
    standard: { en: "The normal case — typical preparation and effort.", nl: "Het normale geval — gebruikelijke voorbereiding en inspanning." },
    medium: { en: "More than standard — extra preparation and complexity.", nl: "Meer dan standaard — extra voorbereiding en complexiteit." },
    high: { en: "Most complex — significant preparation, complexity and risk.", nl: "Meest complex — aanzienlijke voorbereiding, complexiteit en risico." },
  },
  thirdParty: {
    na: { en: "Not needed for this integration.", nl: "Niet nodig voor deze integratie." },
    low: { en: "Known integration flows and technical setup — small risk of issues.", nl: "Bekende integratieflows en technische setup — klein risico op problemen." },
    medium: { en: "Partly known integration flows and setup — medium risk of issues.", nl: "Deels bekende integratieflows en setup — gemiddeld risico op problemen." },
    high: { en: "Unknown integration flows and setup — high risk of issues.", nl: "Onbekende integratieflows en setup — hoog risico op problemen." },
  },
};

export type ActivityBand =
  | "session"
  | "session-prep"
  | "setup"
  | "risk-buffer"
  | "desk-work"
  | "consulting"
  | "development"
  | "support"
  | "project-management";

export function classifyActivity(activity: string): ActivityBand {
  const a = activity.toLowerCase();
  if (a === "session") return "session";
  if (a === "session prep") return "session-prep";
  if (a === "setup") return "setup";
  if (a === "risk buffer") return "risk-buffer";
  if (a === "consulting") return "consulting";
  if (a === "development") return "development";
  if (a === "support") return "support";
  if (a === "project management") return "project-management";
  return "desk-work";
}

interface ActivityStyle {
  badge: string;
  dot: string;
  /** Row background: light gray for Setup, light blue for Session Prep, white for the rest. */
  rowBg: string;
  label: LocalizedString;
}

export const ACTIVITY_STYLES: Record<ActivityBand, ActivityStyle> = {
  session: {
    badge: "bg-brand-indigo/10 text-brand-indigo",
    dot: "bg-brand-indigo",
    rowBg: "bg-white",
    label: { en: "Session", nl: "Sessie" },
  },
  "session-prep": {
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-400",
    rowBg: "bg-sky-50",
    label: { en: "Session Prep", nl: "Voorbereiding" },
  },
  setup: {
    badge: "bg-slate-200 text-slate-700",
    dot: "bg-slate-500",
    rowBg: "bg-slate-100",
    label: { en: "Setup", nl: "Setup" },
  },
  "risk-buffer": {
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
    rowBg: "bg-white",
    label: { en: "Risk Buffer", nl: "Risicobuffer" },
  },
  "desk-work": {
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-400",
    rowBg: "bg-white",
    label: { en: "Desk work", nl: "Deskwork" },
  },
  consulting: {
    badge: "bg-teal-100 text-teal-800",
    dot: "bg-teal-500",
    rowBg: "bg-white",
    label: { en: "Consulting", nl: "Consulting" },
  },
  development: {
    badge: "bg-fuchsia-100 text-fuchsia-800",
    dot: "bg-fuchsia-500",
    rowBg: "bg-white",
    label: { en: "Development", nl: "Development" },
  },
  support: {
    badge: "bg-lime-100 text-lime-800",
    dot: "bg-lime-500",
    rowBg: "bg-white",
    label: { en: "Support", nl: "Support" },
  },
  "project-management": {
    badge: "bg-indigo-100 text-indigo-800",
    dot: "bg-indigo-500",
    rowBg: "bg-white",
    label: { en: "Project management", nl: "Projectmanagement" },
  },
};

// "desk-work" is left out: only legacy (V2-template) estimations still use it, and its
// badge on those rows is self-explanatory.
export const ACTIVITY_LEGEND: ActivityBand[] = ["session", "session-prep", "setup", "risk-buffer"];
/** Client-specific workstreams also offer the service activities. */
export const CUSTOM_ACTIVITY_LEGEND: ActivityBand[] = [...ACTIVITY_LEGEND, "consulting", "development", "support", "project-management"];

interface OpportunityPhaseStyle {
  badge: string;
  dot: string;
  label: LocalizedString;
  description: LocalizedString;
}

/** HubSpot's standard Sales Pipeline deal stages, styled for the dashboard badge + its legend. */
export const OPPORTUNITY_PHASE_STYLES: Record<OpportunityPhase, OpportunityPhaseStyle> = {
  QUALIFIED_TO_BUY: {
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
    dot: "bg-slate-400",
    label: { en: "Qualified to buy", nl: "Qualified to buy" },
    description: { en: "Confirmed as a genuine buyer.", nl: "Bevestigd als een serieuze koper." },
  },
  DEMO_SCHEDULED: {
    badge: "bg-sky-50 text-sky-700 border border-sky-200",
    dot: "bg-sky-400",
    label: { en: "Demo scheduled", nl: "Demo ingepland" },
    description: { en: "A demo or deeper discovery call is on the calendar.", nl: "Een demo of verdiepend gesprek staat gepland." },
  },
  PROPOSAL_SENT: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
    label: { en: "Proposal/price quote sent", nl: "Voorstel/prijsopgave verstuurd" },
    description: { en: "A proposal or price quote is with the prospect.", nl: "Een voorstel of prijsopgave ligt bij de prospect." },
  },
  DECISION_MAKER_BOUGHT_IN: {
    badge: "bg-orange-50 text-orange-700 border border-orange-200",
    dot: "bg-orange-400",
    label: { en: "Decision maker bought-in", nl: "Beslisser akkoord" },
    description: { en: "The decision maker has signed off internally.", nl: "De beslisser heeft intern ingestemd." },
  },
  CONTRACT_SENT: {
    badge: "bg-violet-50 text-violet-700 border border-violet-200",
    dot: "bg-violet-400",
    label: { en: "Contract sent", nl: "Contract verstuurd" },
    description: { en: "The contract is out for signature.", nl: "Het contract ligt klaar voor ondertekening." },
  },
  CLOSED_WON: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    label: { en: "Closed won", nl: "Closed won" },
    description: { en: "Signed - the deal is won.", nl: "Getekend - de deal is binnen." },
  },
  CLOSED_LOST: {
    badge: "bg-brand-crimson/10 text-brand-crimson border border-brand-crimson/30",
    dot: "bg-brand-crimson",
    label: { en: "Closed lost", nl: "Closed lost" },
    description: { en: "The deal did not go ahead.", nl: "De deal is niet doorgegaan." },
  },
};
