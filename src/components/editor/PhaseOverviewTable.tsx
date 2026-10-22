import type { Locale, ProjectPhase } from "@/lib/types";
import { groupByPhase, type EstimationTotals } from "@/lib/calculations";
import { formatCurrency, formatHours, formatPercent } from "@/lib/format";
import { t, UI_STRINGS } from "@/lib/i18n";

const OVERVIEW_COLS = ["40%", "20%", "20%", "20%"];

function ColGroup({ widths }: { widths: string[] }) {
  return (
    <colgroup>
      {widths.map((w, i) => (
        <col key={i} style={{ width: w }} />
      ))}
    </colgroup>
  );
}

function phaseLabel(phase: ProjectPhase | null, locale: Locale) {
  const s = UI_STRINGS.proposalSummary;
  return phase === null ? t(s.phaseNotApplicable, locale) : `${t(s.phase, locale)} ${phase}`;
}

function retainerText(r: { months: number; monthlyPrice: number }, locale: Locale) {
  const s = UI_STRINGS.proposalSummary;
  return `${formatCurrency(r.monthlyPrice, locale)}/${t(s.monthShort, locale)} × ${r.months} ${t(UI_STRINGS.workstreamPanel.months, locale)}`;
}

/** A single onderdeel's (or whole phase's) own PM contribution, nested under its row. */
export function OverviewPmRow({
  label,
  pmPercent,
  pmHours,
  pmRate,
  pmPrice,
  locale,
}: {
  label: string;
  pmPercent: number;
  pmHours: number;
  pmRate: number;
  pmPrice: number;
  locale: Locale;
}) {
  return (
    <tr className="print:break-inside-avoid">
      <td className="truncate py-1 pl-6 pr-3 text-slate-400">
        {label} ({formatPercent(pmPercent)})
      </td>
      <td className="px-3 py-1 text-right tabular-nums text-slate-400">{formatHours(pmHours, locale)}</td>
      <td className="px-3 py-1 text-right tabular-nums text-slate-400">{formatCurrency(pmRate, locale)}</td>
      <td className="px-3 py-1 text-right tabular-nums text-slate-500">{formatCurrency(pmPrice, locale)}</td>
    </tr>
  );
}

/**
 * The phase-grouped roadmap table: every included onderdeel (or, for a
 * workstream whose own sessions span multiple phases, one row per phase
 * slice - see groupByPhase), grouped under Phase 1/2/3/"No phase", each with
 * its own PM line and subtotal, plus subscriptions and the grand total.
 * Shared by the Proposal Summary's own "Overview" page and the editor's
 * "Overview" tab, so both always show the identical roadmap.
 */
export function PhaseOverviewTable({ totals, locale }: { totals: EstimationTotals; locale: Locale }) {
  const s = UI_STRINGS.proposalSummary;
  const { groups: phaseGroups, showPhases } = groupByPhase(totals);

  return (
    <>
      <table className="w-full table-fixed text-left">
        <ColGroup widths={OVERVIEW_COLS} />
        <thead className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="truncate px-3 py-1 font-medium">{t(s.columnWorkstream, locale)}</th>
            <th className="truncate px-3 py-1 text-right font-medium">{t(s.columnHours, locale)}</th>
            <th className="truncate px-3 py-1 text-right font-medium">{t(s.columnRate, locale)}</th>
            <th className="truncate px-3 py-1 text-right font-medium">{t(s.columnPrice, locale)}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {phaseGroups.flatMap((group) => [
            ...(showPhases
              ? [
                  <tr key={`phase-${group.phase}`} className="bg-slate-50 print:break-inside-avoid">
                    <td className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-indigo" colSpan={4}>
                      {phaseLabel(group.phase, locale)}
                    </td>
                  </tr>,
                ]
              : []),
            ...group.rows.flatMap((w) => [
              <tr key={w.key} className="print:break-inside-avoid">
                <td className="truncate px-3 py-1 text-brand-ink">
                  {t(w.label, locale)}
                  {w.isPartial && <span className="text-slate-400"> ({t(s.partialNote, locale)})</span>}
                  {w.retainer && <span className="text-slate-400"> ({retainerText(w.retainer, locale)})</span>}
                </td>
                <td className="px-3 py-1 text-right tabular-nums text-slate-600">{formatHours(w.hours, locale)}</td>
                <td className="px-3 py-1 text-right tabular-nums text-slate-600">
                  {formatCurrency(w.hourlyRate, locale)}
                </td>
                <td className="px-3 py-1 text-right tabular-nums font-medium text-brand-ink">
                  {formatCurrency(w.price, locale)}
                </td>
              </tr>,
              <OverviewPmRow
                key={`${w.key}-pm`}
                label={t(s.projectManagement, locale)}
                pmPercent={totals.pmPercent}
                pmHours={w.pmHours}
                pmRate={totals.pmRate}
                pmPrice={w.pmPrice}
                locale={locale}
              />,
            ]),
            ...(showPhases
              ? [
                  <OverviewPmRow
                    key={`phase-${group.phase}-pm`}
                    label={t(s.projectManagement, locale)}
                    pmPercent={totals.pmPercent}
                    pmHours={group.pmHours}
                    pmRate={totals.pmRate}
                    pmPrice={group.pmPrice}
                    locale={locale}
                  />,
                  <tr key={`phase-${group.phase}-total`} className="font-semibold text-brand-ink print:break-inside-avoid">
                    <td className="truncate px-3 py-1">
                      {t(s.phaseSubtotal, locale)} {group.phase ?? t(s.notApplicableShort, locale)}
                    </td>
                    <td className="px-3 py-1 text-right tabular-nums">{formatHours(group.hours, locale)}</td>
                    <td />
                    <td className="px-3 py-1 text-right tabular-nums">{formatCurrency(group.price, locale)}</td>
                  </tr>,
                ]
              : []),
          ])}
          {totals.subscriptions
            .filter((sub) => sub.qty > 0)
            .map((sub) => (
              <tr key={sub.label.en} className="print:break-inside-avoid">
                <td className="truncate px-3 py-1 text-brand-ink" colSpan={3}>
                  {t(sub.label, locale)} ({sub.qty}&times;)
                </td>
                <td className="px-3 py-1 text-right tabular-nums font-medium text-brand-ink">
                  {formatCurrency(sub.price, locale)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between bg-brand-indigo px-3 py-2 text-white">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-white/80">{t(s.grandTotal, locale)}</div>
          <div className="text-[10px] text-white/70">
            {formatHours(totals.totalEffortHours, locale)} {t(s.totalEffort, locale)}
          </div>
        </div>
        <div className="text-lg font-semibold tabular-nums">{formatCurrency(totals.grandTotalPrice, locale)}</div>
      </div>
    </>
  );
}
