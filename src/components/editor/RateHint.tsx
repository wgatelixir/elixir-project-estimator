import { formatCurrency } from "@/lib/format";
import { t, UI_STRINGS } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/**
 * Always-visible reference to the standard rate-card price for a field,
 * shown next to the editable rate so it stays visible even after someone
 * overrides it for a specific estimation. Highlighted when it no longer
 * matches the current value.
 */
export function RateHint({
  rate,
  defaultRate,
  locale = "en",
}: {
  rate: number;
  defaultRate: number;
  locale?: Locale;
}) {
  const overridden = rate !== defaultRate;
  return (
    <span className={`whitespace-nowrap ${overridden ? "font-medium text-brand-crimson" : "text-slate-400"}`}>
      {t(UI_STRINGS.rateHint.standard, locale)} {formatCurrency(defaultRate, locale)}/h
    </span>
  );
}
