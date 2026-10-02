"use client";

import type { EstimationTotals } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";
import type { ComplexityBand } from "@/lib/style";
import { PanelLegend } from "./Legend";
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
  pmRate: number;
  pmPercent: number;
  onChangePm: (next: { pmRate?: number; pmPercent?: number }) => void;
  onOpenProposal: () => void;
  /** Complexity guide for whichever tab is currently open, so it stays visible while scrolling a long workstream. Undefined on tabs with no complexity system (Cover, ElixirSync). */
  legend?: ActiveComplexityLegend;
  locale?: Locale;
}

export function SummarySidebar({
  totals,
  pmRate,
  pmPercent,
  onChangePm,
  onOpenProposal,
  legend,
  locale = "en",
}: SummarySidebarProps) {
  const s = UI_STRINGS.summarySidebar;
  return (
    <div className="sticky top-4 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-ink">{t(s.summary, locale)}</h2>
        <dl className="mt-3 space-y-1.5 text-sm">
          {totals.workstreams
            .filter((w) => w.enabled)
            .map((w) => (
              <div key={w.key} className="flex items-center justify-between gap-2">
                <dt className="truncate text-slate-500">{t(w.label, locale)}</dt>
                <dd className="whitespace-nowrap tabular-nums text-slate-700">
                  {formatHours(w.hours, locale)}
                </dd>
              </div>
            ))}
          {totals.thirdParty.enabled && (
            <div className="flex items-center justify-between gap-2">
              <dt className="truncate text-slate-500">{t(totals.thirdParty.label, locale)}</dt>
              <dd className="whitespace-nowrap tabular-nums text-slate-700">
                {formatHours(totals.thirdParty.hours, locale)}
              </dd>
            </div>
          )}
          {totals.elixirSync.enabled && (
            <div className="flex items-center justify-between gap-2">
              <dt className="truncate text-slate-500">{t(totals.elixirSync.label, locale)}</dt>
              <dd className="whitespace-nowrap tabular-nums text-slate-700">
                {formatHours(totals.elixirSync.hours, locale)}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{t(s.billableEffort, locale)}</span>
            <span className="tabular-nums font-medium text-brand-ink">
              {formatHours(totals.billableHours, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{formatCurrency(totals.billablePrice, locale)}</span>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-slate-500">{t(s.projectManagement, locale)}</span>
            <span className="tabular-nums text-slate-700">{formatHours(totals.pmHours, locale)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
            <span>{t(s.pmPercent, locale)}</span>
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={pmPercent}
              onChange={(e) => onChangePm({ pmPercent: Number(e.target.value) })}
              className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-right tabular-nums focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
            />
            <span>{t(s.rate, locale)}</span>
            <input
              type="number"
              min={0}
              value={pmRate}
              onChange={(e) => onChangePm({ pmRate: Number(e.target.value) })}
              className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-right tabular-nums focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
            />
          </div>
        </div>

        {totals.subscriptions.some((s) => s.qty > 0) && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            {totals.subscriptions
              .filter((sub) => sub.qty > 0)
              .map((sub) => (
                <div key={sub.label.en} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-500">{t(sub.label, locale)}</span>
                  <span className="tabular-nums text-slate-700">{formatCurrency(sub.price, locale)}</span>
                </div>
              ))}
          </div>
        )}

        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-brand-ink">{t(s.totalEffort, locale)}</span>
            <span className="tabular-nums font-medium text-brand-ink">
              {formatHours(totals.totalEffortHours, locale)}
            </span>
          </div>
        </div>

        <div className="mt-2 rounded-md bg-brand-indigo p-3 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">{t(s.grandTotal, locale)}</div>
          <div className="text-xl font-semibold tabular-nums">
            {formatCurrency(totals.grandTotalPrice, locale)}
          </div>
        </div>

        <button
          onClick={onOpenProposal}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-brand-indigo px-3 py-2 text-sm font-medium text-brand-indigo transition-colors hover:bg-brand-indigo hover:text-white"
        >
          {t(s.viewProposalSummary, locale)}
        </button>
      </div>

      {legend && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="px-4 pt-3 pb-1">
            <h2 className="text-sm font-semibold text-brand-ink">{t(legend.label, locale)}</h2>
            <p className="text-xs text-slate-400">{t(s.complexityGuide, locale)}</p>
          </div>
          <PanelLegend
            variant={legend.variant}
            showActivity={legend.variant === "standard"}
            sessionHours={legend.sessionHours}
            setupHours={legend.setupHours}
            comments={legend.comments}
            layout="compact"
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}
