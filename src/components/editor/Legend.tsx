import {
  ACTIVITY_LEGEND,
  ACTIVITY_STYLES,
  COMPLEXITY_DESCRIPTIONS,
  COMPLEXITY_LEGEND,
  COMPLEXITY_LEGEND_THIRD_PARTY,
  COMPLEXITY_STYLES,
} from "@/lib/style";

interface PanelLegendProps {
  /** "standard" = Session/Setup workstreams, "thirdParty" = Third Party Integration's own complexity scale. */
  variant?: "standard" | "thirdParty";
  /** Third Party has no Activity legend of its own (Session/Setup already shown by the standard legend). */
  showActivity?: boolean;
}

export function PanelLegend({ variant = "standard", showActivity = true }: PanelLegendProps) {
  const bands = variant === "thirdParty" ? COMPLEXITY_LEGEND_THIRD_PARTY : COMPLEXITY_LEGEND;
  const descriptions = COMPLEXITY_DESCRIPTIONS[variant];

  return (
    <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-500">
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
      <div className={`grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4 ${showActivity ? "mt-1.5" : ""}`}>
        {bands.map((band) => {
          const style = COMPLEXITY_STYLES[band];
          return (
            <div key={band} className="flex items-start gap-1.5">
              <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${style.dot}`} />
              <span>
                <span className="font-medium text-slate-600">{style.label}:</span>{" "}
                <span>{descriptions[band]}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
