import {
  ACTIVITY_LEGEND,
  ACTIVITY_STYLES,
  COMPLEXITY_LEGEND,
  COMPLEXITY_STYLES,
} from "@/lib/style";

export function PanelLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 bg-slate-50/60 px-3 py-1.5 text-[11px] text-slate-500">
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
      <span className="mx-1 h-3 w-px bg-slate-200" />
      <span className="font-medium text-slate-400">Complexity:</span>
      {COMPLEXITY_LEGEND.map((band) => {
        const style = COMPLEXITY_STYLES[band];
        return (
          <span key={band} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            {style.label}
          </span>
        );
      })}
    </div>
  );
}
