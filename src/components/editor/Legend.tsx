import type { ActivityBand, ComplexityBand } from "@/lib/style";
import {
  ACTIVITY_LEGEND,
  ACTIVITY_STYLES,
  COMPLEXITY_DESCRIPTIONS,
  COMPLEXITY_LEGEND,
  COMPLEXITY_LEGEND_THIRD_PARTY,
  COMPLEXITY_STYLES,
} from "@/lib/style";
import { formatHours, formatHoursDelta } from "@/lib/format";
import { t, UI_STRINGS } from "@/lib/i18n";
import type { Locale, LocalizedString } from "@/lib/types";

type BandHours = Partial<Record<ComplexityBand, number>>;

interface ComplexityGuideProps {
  /** "standard" = Session/Setup workstreams, "thirdParty" = Third Party Integration's own complexity scale. */
  variant?: "standard" | "thirdParty";
  /** +/- hours delta per band, read from the Session complexity table currently in effect. */
  sessionHours?: BandHours;
  /** +/- hours delta per band, read from the Setup complexity table currently in effect. */
  setupHours?: BandHours;
  /** The sheet's own "Comment" text per band (see complexityCommentsByBand); falls back to COMPLEXITY_DESCRIPTIONS. */
  comments?: Partial<Record<ComplexityBand, LocalizedString>>;
  /** "compact" stacks the levels (sidebar); "wide" puts them side by side (full-width panels, proposal). */
  layout?: "wide" | "compact";
  locale?: Locale;
}

interface PanelLegendProps extends ComplexityGuideProps {
  /** Show the activity colour key (Session, Prep, Setup, ...). */
  showActivity?: boolean;
  /** Show the complexity scale too; editor panels leave it to the sidebar. */
  showComplexity?: boolean;
  /** Which activity types the legend lists; defaults to the template's (Session, Prep, Setup, Risk Buffer). */
  activityBands?: ActivityBand[];
  /** Where the legend sits relative to its panel's content, so its border faces the right way. */
  position?: "top" | "bottom";
}

// Position on the 4-step scale shown as a small meter next to each level.
const BAND_STEP: Record<ComplexityBand, number> = { na: 0, low: 1, standard: 2, medium: 3, high: 4 };

/**
 * Hours per level. Standard workstreams add a delta to each line's standard effort
 * ("+2h"); Third Party lines take the table's hours as they are ("8h").
 */
function hoursText(
  band: ComplexityBand,
  locale: Locale,
  absolute: boolean,
  sessionHours?: BandHours,
  setupHours?: BandHours
): string | null {
  const fmt = (n: number) => (absolute ? formatHours(n, locale) : formatHoursDelta(n, locale));
  const s = sessionHours?.[band];
  const u = setupHours?.[band];
  if (s === undefined && u === undefined) return null;
  if (s === undefined || u === undefined || s === u) return fmt((s ?? u)!);
  return `${locale === "nl" ? "Sessie" : "Session"} ${fmt(s)} · Setup ${fmt(u)}`;
}

/**
 * The sheet's level texts read "<session setup>, <what differs>" (e.g. "3 hr
 * Session with 2 people, high complexity and high preparation time"). Split
 * them so what differs leads; a setup shared by every level is said once.
 */
function splitLevelTexts(texts: (string | null)[]): {
  shared: string | null;
  levels: { main: string | null; setup: string | null }[];
} {
  const parts = texts.map((x) => {
    if (!x) return { head: null, tail: null };
    const i = x.indexOf(", ");
    if (i < 0) return { head: null, tail: x };
    const tail = x.slice(i + 2);
    return { head: x.slice(0, i), tail: tail.charAt(0).toUpperCase() + tail.slice(1) };
  });
  const heads = parts.map((p) => p.head).filter((h): h is string => !!h);
  const shared = heads.length > 1 && heads.length === parts.filter((p) => p.tail).length && heads.every((h) => h === heads[0]) ? heads[0] : null;
  return {
    shared,
    levels: parts.map((p) => ({ main: p.tail, setup: shared ? null : p.head })),
  };
}

function StepMeter({ band }: { band: ComplexityBand }) {
  const step = BAND_STEP[band];
  const fill = COMPLEXITY_STYLES[band].dot;
  return (
    <span className="flex items-end gap-0.5" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`w-1 rounded-sm ${i <= step ? fill : "bg-slate-200"}`} style={{ height: 4 + i * 2 }} />
      ))}
    </span>
  );
}

/** The complexity scale: per level its colour pill, a small step meter, the hours it adds and what it means. */
export function ComplexityGuide({
  variant = "standard",
  sessionHours,
  setupHours,
  comments,
  layout = "compact",
  locale = "en",
}: ComplexityGuideProps) {
  const s = UI_STRINGS.legend;
  const bands = variant === "thirdParty" ? COMPLEXITY_LEGEND_THIRD_PARTY : COMPLEXITY_LEGEND;
  const fallback = COMPLEXITY_DESCRIPTIONS[variant];
  const texts = bands.map((band) => {
    const text = comments?.[band] ?? fallback[band];
    return text ? t(text, locale) : null;
  });
  const isThirdParty = variant === "thirdParty";
  // Third Party's texts aren't "<session setup>, <difference>", so they're shown whole.
  const { shared, levels } = isThirdParty
    ? { shared: null, levels: texts.map((main) => ({ main, setup: null })) }
    : splitLevelTexts(texts);
  const wide = layout === "wide";

  return (
    <div>
      <p className="text-[11px] text-slate-500">
        {t(isThirdParty ? s.complexityIntroThirdParty : s.complexityIntro, locale)}
        {shared && (
          <>
            {" "}
            <span className="text-slate-600">
              {t(s.basis, locale)}: {shared.toLowerCase()}.
            </span>
          </>
        )}
      </p>
      <ul className={wide ? "mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" : "mt-2 divide-y divide-slate-100"}>
        {bands.map((band, i) => {
          const style = COMPLEXITY_STYLES[band];
          const delta = hoursText(band, locale, isThirdParty, sessionHours, setupHours);
          return (
            <li
              key={band}
              className={wide ? "rounded-md border border-slate-200 bg-white px-2.5 py-2" : "py-2 first:pt-0 last:pb-0"}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <StepMeter band={band} />
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${style.badge}`}>{t(style.label, locale)}</span>
                </span>
                {delta && (
                  <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-brand-ink">{delta}</span>
                )}
              </div>
              {levels[i].main && <p className="mt-1 text-[11px] leading-snug text-slate-600">{levels[i].main}</p>}
              {levels[i].setup && <p className="text-[11px] leading-snug text-slate-400">{levels[i].setup}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Activity colour key: the same pills the table rows use, so a glance links the two. */
export function ActivityLegend({ bands = ACTIVITY_LEGEND, locale = "en" }: { bands?: ActivityBand[]; locale?: Locale }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-medium text-slate-400">{t(UI_STRINGS.legend.activityLabel, locale)}</span>
      {bands.map((band) => {
        const style = ACTIVITY_STYLES[band];
        return (
          <span key={band} className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${style.badge}`}>
            {t(style.label, locale)}
          </span>
        );
      })}
    </div>
  );
}

/** A panel's legend strip: the activity key and/or the complexity scale. */
export function PanelLegend({
  showActivity = true,
  showComplexity = true,
  activityBands = ACTIVITY_LEGEND,
  position = "top",
  layout = "wide",
  ...guide
}: PanelLegendProps) {
  if (!showActivity && !showComplexity) return null;
  const borderClass = position === "bottom" ? "border-t" : "border-b";
  return (
    <div className={`${borderClass} space-y-2.5 border-slate-100 bg-slate-50/60 px-3 py-2.5`}>
      {showActivity && <ActivityLegend bands={activityBands} locale={guide.locale} />}
      {showComplexity && <ComplexityGuide {...guide} layout={layout} />}
    </div>
  );
}
