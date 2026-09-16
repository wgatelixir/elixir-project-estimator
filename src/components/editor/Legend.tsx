import type { ComplexityBand } from "@/lib/style";
import {
  ACTIVITY_LEGEND,
  ACTIVITY_STYLES,
  COMPLEXITY_DESCRIPTIONS,
  COMPLEXITY_LEGEND,
  COMPLEXITY_LEGEND_THIRD_PARTY,
  COMPLEXITY_STYLES,
} from "@/lib/style";
import { formatHoursDelta } from "@/lib/format";

interface PanelLegendProps {
  /** "standard" = Session/Setup workstreams, "thirdParty" = Third Party Integration's own complexity scale. */
  variant?: "standard" | "thirdParty";
  /** Third Party has no Activity legend of its own (Session/Setup already shown by the standard legend). */
  showActivity?: boolean;
  /** +/- hours delta per band, read from the Session complexity table currently in effect. */
  sessionHours?: Partial<Record<ComplexityBand, number>>;
  /** +/- hours delta per band, read from the Setup complexity table currently in effect. */
  setupHours?: Partial<Record<ComplexityBand, number>>;
  /** Real spreadsheet "Comment" text per band (from the Session table - see complexityCommentsByBand). Falls back to the generic COMPLEXITY_DESCRIPTIONS wording where absent. */
  comments?: Partial<Record<ComplexityBand, string>>;
  /** Where the legend sits relative to its panel's content, so its border faces the right way. */
  position?: "top" | "bottom";
  /** "wide" (default) lays levels out in a 2/4-col grid for full-width panels; "compact" stacks them in one column for narrow containers like the sidebar. */
  layout?: "wide" | "compact";
}

function deltaTextFor(
  band: ComplexityBand,
  sessionHours?: Partial<Record<ComplexityBand, number>>,
  setupHours?: Partial<Record<ComplexityBand, number>>
): string | null {
  const s = sessionHours?.[band];
  const u = setupHours?.[band];
  if (s === undefined && u === undefined) return null;
  if (s === undefined) return formatHoursDelta(u!);
  if (u === undefined) return formatHoursDelta(s);
  return s === u ? formatHoursDelta(s) : `Session ${formatHoursDelta(s)} · Setup ${formatHoursDelta(u)}`;
}

export function PanelLegend({
  variant = "standard",
  showActivity = true,
  sessionHours,
  setupHours,
  comments,
  position = "top",
  layout = "wide",
}: PanelLegendProps) {
  const bands = variant === "thirdParty" ? COMPLEXITY_LEGEND_THIRD_PARTY : COMPLEXITY_LEGEND;
  const fallbackDescriptions = COMPLEXITY_DESCRIPTIONS[variant];
  const borderClass = position === "bottom" ? "border-t" : "border-b";
  const gridClass =
    layout === "compact" ? "flex flex-col gap-1.5" : "grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4";

  return (
    <div className={`${borderClass} border-slate-100 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-500`}>
      {showActivity && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-medium text-slate-400">Activity:</span>
          {ACTIVITY_LEGEND.map((band) => {
            const style = ACTIVITY_STYLES[band];
            return (
              <span key={band} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                {style.label}
              </span>
            );
          })}
        </div>
      )}
      <div className={`${gridClass} ${showActivity ? "mt-1.5" : ""}`}>
        {bands.map((band) => {
          const style = COMPLEXITY_STYLES[band];
          const delta = deltaTextFor(band, sessionHours, setupHours);
          return (
            <div key={band} className="flex items-start gap-1.5">
              <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${style.dot}`} />
              <span>
                <span className="font-medium text-slate-600">
                  {style.label}
                  {delta && <span className="font-normal text-slate-500"> ({delta})</span>}:
                </span>{" "}
                <span>{comments?.[band] ?? fallbackDescriptions[band]}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
