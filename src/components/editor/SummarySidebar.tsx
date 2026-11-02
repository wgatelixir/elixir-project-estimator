"use client";

import { useEffect, useState } from "react";
import { ChevronDown, FileJson, FileSpreadsheet, Presentation, iconProps } from "@/components/ui/icons";
import { groupByPhase, totalsByStage, type EstimationTotals } from "@/lib/calculations";
import { formatCurrency, formatHours, formatPercent } from "@/lib/format";
import type { ComplexityBand } from "@/lib/style";
import { ComplexityGuide } from "./Legend";
import { t, UI_STRINGS } from "@/lib/i18n";
import type { Locale, LocalizedString } from "@/lib/types";

export interface ActiveComplexityLegend {
  label: LocalizedString;
  variant: "standard" | "thirdParty";
  sessionHours: Partial<Record<ComplexityBand, number>>;
  setupHours: Partial<Record<ComplexityBand, number>>;
  comments: Partial<Record<ComplexityBand, LocalizedString>>;
}

interface SummarySidebarProps {
  totals: EstimationTotals;
  onOpenProposal: () => void;
  /** Downloads the in-scope workstreams, lines, hours and rates for import into other software. */
  onExport: (format: "xlsx" | "json") => void;
  /** Complexity guide for whichever tab is currently open, so it stays visible while scrolling a long workstream. Undefined on tabs with no complexity system (Cover, ElixirSync). */
  legend?: ActiveComplexityLegend;
  locale?: Locale;
}

const GUIDE_OPEN_KEY = "estimator.complexityGuideOpen";

/** Open/closed state of the complexity guide, remembered per browser (a convenience; open when unknown). */
function useGuideOpen(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      // Read after mount so the server render (always open) and the first client render match.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (window.localStorage.getItem(GUIDE_OPEN_KEY) === "false") setOpen(false);
    } catch {
      // Storage blocked (private mode etc.): just stay open.
    }
  }, []);
  function update(next: boolean) {
    setOpen(next);
    try {
      window.localStorage.setItem(GUIDE_OPEN_KEY, String(next));
    } catch {
      // Not remembered, but the toggle still works for this page view.
    }
  }
  return [open, update];
}

export function SummarySidebar({
  totals,
  onOpenProposal,
  onExport,
  legend,
  locale = "en",
}: SummarySidebarProps) {
  const s = UI_STRINGS.summarySidebar;
  const { groups: phaseGroups, showPhases } = groupByPhase(totals);
  const byStage = totalsByStage(totals);
  const [guideOpen, setGuideOpen] = useGuideOpen();
  return (
    <div className="sticky top-4 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-brand-indigo">{t(s.summary, locale)}</h2>

        {/* One line per onderdeel: name and price. Hours, PM per onderdeel and phase
            subtotals live on the Overview tab, so this stays readable at a glance. */}
        <div className="mt-3 space-y-3">
          {phaseGroups.length === 0 && <p className="text-sm text-slate-400">{t(s.nothingIncluded, locale)}</p>}
          {phaseGroups.map((group) => (
            <div key={String(group.phase)}>
              {showPhases && (
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {group.phase === null
                    ? t(UI_STRINGS.proposalSummary.phaseNotApplicable, locale)
                    : `${t(UI_STRINGS.proposalSummary.phase, locale)} ${group.phase}`}
                </div>
              )}
              <ul className="space-y-1 text-sm">
                {group.rows.map((w) => (
                  <li key={w.key} className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-slate-600" title={t(w.label, locale)}>
                      {t(w.label, locale)}
                      {w.isPartial && (
                        <span className="text-slate-400"> ({t(UI_STRINGS.proposalSummary.partialNote, locale)})</span>
                      )}
                    </span>
                    <span className="whitespace-nowrap tabular-nums text-brand-ink">{formatCurrency(w.price, locale)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <dl className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-600">
              {t(s.implementation, locale)}
              <span className="ml-1.5 text-xs text-slate-400">{formatHours(totals.billableHours, locale)}</span>
            </dt>
            <dd className="tabular-nums text-brand-ink">{formatCurrency(totals.billablePrice, locale)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-600" title={t(s.projectManagement, locale)}>
              {t(s.pmShort, locale)} ({formatPercent(totals.pmPercent)})
              <span className="ml-1.5 text-xs text-slate-400">{formatHours(totals.pmHours, locale)}</span>
            </dt>
            <dd className="tabular-nums text-brand-ink">{formatCurrency(totals.pmPrice, locale)}</dd>
          </div>
          {totals.subscriptions
            .filter((sub) => sub.qty > 0)
            .map((sub) => (
              <div key={sub.label.en} className="flex items-baseline justify-between gap-3">
                <dt className="truncate text-slate-600">{t(sub.label, locale)}</dt>
                <dd className="tabular-nums text-brand-ink">{formatCurrency(sub.price, locale)}</dd>
              </div>
            ))}
        </dl>

        <div className="mt-3 rounded-md bg-brand-indigo px-3 py-2.5 text-white">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/80">{t(s.grandTotal, locale)}</span>
            <span className="text-xs text-white/70">{formatHours(totals.totalEffortHours, locale)}</span>
          </div>
          <div className="text-xl font-semibold tabular-nums">{formatCurrency(totals.grandTotalPrice, locale)}</div>
          {/* Forecast split, only once something is actually won - otherwise it would just repeat the total. */}
          {byStage.closed_won.price > 0 && (
            <div className="mt-1.5 space-y-0.5 border-t border-white/20 pt-1.5 text-xs" title={t(s.stageSplitTitle, locale)}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/80">{t(UI_STRINGS.coverPage.stageClosedWon, locale)}</span>
                <span className="tabular-nums">{formatCurrency(byStage.closed_won.price, locale)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white/80">{t(s.forecastProposal, locale)}</span>
                <span className="tabular-nums">{formatCurrency(byStage.proposal.price, locale)}</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onOpenProposal}
          className="btn btn-secondary mt-2 w-full"
        >
          <Presentation {...iconProps} />
          {t(s.viewProposalSummary, locale)}
        </button>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500" title={t(s.exportTitle, locale)}>
          <span>{t(s.exportLabel, locale)}</span>
          {(["xlsx", "json"] as const).map((format) => (
            <button
              key={format}
              onClick={() => onExport(format)}
              className="btn btn-sm btn-ghost flex-1 border-slate-200"
            >
              {format === "xlsx" ? <FileSpreadsheet {...iconProps} /> : <FileJson {...iconProps} />}
              {format === "xlsx" ? t(s.exportExcel, locale) : t(s.exportJson, locale)}
            </button>
          ))}
        </div>
      </div>

      {legend && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setGuideOpen(!guideOpen)}
            aria-expanded={guideOpen}
            title={t(guideOpen ? UI_STRINGS.legend.hideGuide : UI_STRINGS.legend.showGuide, locale)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <span className="min-w-0">
              <span className="block text-sm font-bold text-brand-indigo">{t(s.complexityGuide, locale)}</span>
              <span className="block truncate text-xs text-slate-400">{t(legend.label, locale)}</span>
            </span>
            <ChevronDown
              {...iconProps}
              className={`flex-shrink-0 text-slate-400 transition-transform ${guideOpen ? "rotate-180" : ""}`}
            />
          </button>
          {guideOpen && (
            <div className="border-t border-slate-100 px-4 py-3">
              <ComplexityGuide
                variant={legend.variant}
                sessionHours={legend.sessionHours}
                setupHours={legend.setupHours}
                comments={legend.comments}
                layout="compact"
                locale={locale}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
