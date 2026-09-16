import { formatCurrency } from "@/lib/format";

/**
 * Always-visible reference to the standard rate-card price for a field,
 * shown next to the editable rate so it stays visible even after someone
 * overrides it for a specific estimation. Highlighted when it no longer
 * matches the current value.
 */
export function RateHint({ rate, defaultRate }: { rate: number; defaultRate: number }) {
  const overridden = rate !== defaultRate;
  return (
    <span className={`whitespace-nowrap ${overridden ? "font-medium text-brand-crimson" : "text-slate-400"}`}>
      standard {formatCurrency(defaultRate)}/h
    </span>
  );
}
