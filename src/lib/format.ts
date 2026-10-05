import type { Locale } from "./types";

const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  nl: "nl-NL",
};

function currencyFormatter(locale: Locale) {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function hoursFormatter(locale: Locale) {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    maximumFractionDigits: 1,
  });
}

export function formatCurrency(value: number, locale: Locale = "en"): string {
  return currencyFormatter(locale).format(value);
}

export function formatHours(value: number, locale: Locale = "en"): string {
  return `${hoursFormatter(locale).format(value)}h`;
}

/** Signed delta for complexity legends, e.g. "+2h", "-1h", "0h". */
export function formatHoursDelta(value: number, locale: Locale = "en"): string {
  if (value === 0) return "0h";
  const formatted = hoursFormatter(locale).format(value);
  return value > 0 ? `+${formatted}h` : `${formatted}h`;
}

/** e.g. 0.15 -> "15%". Used for the PM % shown next to each onderdeel's own PM row. */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDate(iso: string, locale: Locale = "en"): string {
  return new Date(iso).toLocaleDateString(locale === "nl" ? "nl-NL" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
