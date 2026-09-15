// Shared color coding for complexity levels and activity types, used by
// both the interactive editor panels (colored <select>/badges) and the
// read-only proposal summary (static pills) so the two stay visually
// consistent.

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
  label: string;
}

export const COMPLEXITY_STYLES: Record<ComplexityBand, ComplexityStyle> = {
  low: {
    badge: "bg-sky-50 text-sky-700 border border-sky-200",
    select: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-400",
    label: "Low",
  },
  standard: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    select: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-400",
    label: "Standard",
  },
  medium: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    select: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    label: "Medium",
  },
  high: {
    badge: "bg-brand-crimson/10 text-brand-crimson border border-brand-crimson/30",
    select: "bg-brand-crimson/10 text-brand-crimson border-brand-crimson/30",
    dot: "bg-brand-crimson",
    label: "High",
  },
  na: {
    badge: "bg-slate-100 text-slate-500 border border-slate-200",
    select: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-300",
    label: "N/A",
  },
};

export const COMPLEXITY_LEGEND: ComplexityBand[] = ["low", "standard", "medium", "high"];

export type ActivityBand = "session" | "setup" | "desk-work";

export function classifyActivity(activity: string): ActivityBand {
  const a = activity.toLowerCase();
  if (a === "session") return "session";
  if (a === "setup") return "setup";
  return "desk-work";
}

interface ActivityStyle {
  badge: string;
  dot: string;
  /** Left-border accent applied to the line item's table row. */
  rowAccent: string;
  label: string;
}

export const ACTIVITY_STYLES: Record<ActivityBand, ActivityStyle> = {
  session: {
    badge: "bg-brand-indigo/10 text-brand-indigo",
    dot: "bg-brand-indigo",
    rowAccent: "border-l-brand-indigo/40",
    label: "Session",
  },
  setup: {
    badge: "bg-slate-200 text-slate-700",
    dot: "bg-slate-500",
    rowAccent: "border-l-slate-400",
    label: "Setup",
  },
  "desk-work": {
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-400",
    rowAccent: "border-l-violet-300",
    label: "Desk work",
  },
};

export const ACTIVITY_LEGEND: ActivityBand[] = ["session", "setup", "desk-work"];
