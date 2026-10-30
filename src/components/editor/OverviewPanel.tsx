import type { Locale } from "@/lib/types";
import type { EstimationTotals } from "@/lib/calculations";
import { t, UI_STRINGS } from "@/lib/i18n";
import { PhaseOverviewTable } from "./PhaseOverviewTable";

/**
 * Editor-native view of the same phase-grouped roadmap shown on the
 * Proposal Summary's "Overview" page - lets you check how the project
 * splits across Phase 1/2/3 (set per onderdeel on Cover, or per session
 * within a workstream) without leaving the editor to open the proposal.
 */
export function OverviewPanel({ totals, locale = "en" }: { totals: EstimationTotals; locale?: Locale }) {
  const s = UI_STRINGS.overviewPanel;
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-4">
        <h2 className="text-sm font-bold text-brand-indigo">{t(s.title, locale)}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{t(s.intro, locale)}</p>
      </div>
      <PhaseOverviewTable totals={totals} locale={locale} />
    </div>
  );
}
