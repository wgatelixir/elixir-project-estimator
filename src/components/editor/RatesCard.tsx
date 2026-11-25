import type { Locale } from "@/lib/types";
import { t, UI_STRINGS } from "@/lib/i18n";
import { GroupCard } from "./GroupCard";

/**
 * One place to set this estimation's two rates: PM (direct) and the bulk
 * "service rate" for everything else (direct too, but it also reprices
 * every onderdeel still following it - see applyServiceRate).
 *
 * PM itself can be entered either way - as a percentage, or as a total
 * number of hours - and the other figure updates to match. Typing hours
 * reverse-solves a new pmPercent from the estimation's current PM-eligible
 * base (see WorkstreamTotals.pmFixedHours/pmVariableBaseHours): pmPercent
 * stays the one thing actually persisted, so PM still scales with the
 * project's scope afterwards, same as it always has.
 */
export function RatesCard({
  pmRate,
  pmPercent,
  pmHours,
  pmFixedHours,
  pmVariableBaseHours,
  serviceRate,
  locale,
  onChangePmRate,
  onChangePmPercent,
  onChangeServiceRate,
}: {
  pmRate: number;
  /** Stored as a fraction (0.15); edited here as a percentage (15). */
  pmPercent: number;
  /** The estimation's current total PM hours, at pmPercent - i.e. pmFixedHours + pmVariableBaseHours * pmPercent. */
  pmHours: number;
  /** PM hours already fixed by a line's own override, unaffected by pmPercent - see StandardLineItem.pmPercent. */
  pmFixedHours: number;
  /** The base hours pmPercent actually applies to; 0 means PM can't be entered as hours right now. */
  pmVariableBaseHours: number;
  serviceRate: number;
  locale: Locale;
  onChangePmRate: (rate: number) => void;
  onChangePmPercent: (fraction: number) => void;
  onChangeServiceRate: (rate: number) => void;
}) {
  const s = UI_STRINGS.coverPage;
  const field =
    "w-20 rounded border border-slate-300 bg-white px-2 py-1.5 text-right tabular-nums focus:border-brand-indigo focus:outline-none";

  function handleHoursChange(value: number) {
    if (!(value >= 0) || pmVariableBaseHours <= 0) return;
    const newPercent = (value - pmFixedHours) / pmVariableBaseHours;
    onChangePmPercent(Math.min(1, Math.max(0, newPercent)));
  }
  return (
    <GroupCard title={t(s.ratesTitle, locale)} description={t(s.ratesDescription, locale)}>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{t(s.pmRateInputLabel, locale)}</span>
          <span className="flex items-center gap-1">
            &euro;
            <input
              type="number"
              min={0}
              value={pmRate}
              onChange={(e) => onChangePmRate(Number(e.target.value))}
              className={field}
            />
            /h
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{t(s.pmPercentInputLabel, locale)}</span>
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={Math.round(pmPercent * 1000) / 10}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 0 && value <= 100) onChangePmPercent(value / 100);
              }}
              className={field}
            />
            %
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm" title={t(s.pmHoursInputTitle, locale)}>
          <span className="text-slate-500">{t(s.pmHoursInputLabel, locale)}</span>
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              step={0.5}
              disabled={pmVariableBaseHours <= 0}
              value={Math.round(pmHours * 10) / 10}
              onChange={(e) => handleHoursChange(Number(e.target.value))}
              className={`${field} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            />
            {t(s.columnHours, locale)}
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{t(s.serviceRateInputLabel, locale)}</span>
          <span className="flex items-center gap-1">
            &euro;
            <input
              type="number"
              min={0}
              value={serviceRate}
              onChange={(e) => onChangeServiceRate(Number(e.target.value))}
              className={field}
            />
            /h
          </span>
        </label>
      </div>
    </GroupCard>
  );
}
