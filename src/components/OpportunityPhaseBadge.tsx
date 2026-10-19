import type { OpportunityPhase } from "@/lib/types";
import { OPPORTUNITY_PHASES } from "@/lib/types";
import { OPPORTUNITY_PHASE_STYLES } from "@/lib/style";

export function OpportunityPhaseBadge({ phase }: { phase: OpportunityPhase }) {
  const style = OPPORTUNITY_PHASE_STYLES[phase];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label.en}
    </span>
  );
}

export function OpportunityPhaseLegend() {
  return (
    <details className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm">
      <summary className="cursor-pointer font-medium text-slate-600">Opportunity phase legend</summary>
      <ul className="mt-2 space-y-1.5">
        {OPPORTUNITY_PHASES.map((phase) => {
          const style = OPPORTUNITY_PHASE_STYLES[phase];
          return (
            <li key={phase} className="flex items-start gap-2">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
              <span>
                <span className="font-medium text-slate-700">{style.label.en}</span>
                <span className="text-slate-500"> — {style.description.en}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
