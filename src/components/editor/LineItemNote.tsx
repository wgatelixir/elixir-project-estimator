import { t } from "@/lib/i18n";
import type { Locale, LocalizedString } from "@/lib/types";

/**
 * Renders a StandardLineItem/ThirdPartyLineItem's free-text `comment`, straight from the
 * source spreadsheet's own Comment column (e.g. deliverable notes, "Only for
 * uni-dimensional projects" scope tags). A dimension tag gets a small badge
 * since it's a scope rule to act on, not just descriptive text.
 */
export function LineItemNote({
  comment,
  locale = "en",
}: {
  comment?: LocalizedString | null;
  locale?: Locale;
}) {
  if (!comment) return null;

  // Checked against the English text regardless of display locale, since
  // both language variants of the tag mean the same scope rule.
  const isDimensionTag = /^only for /i.test(comment.en);
  if (isDimensionTag) {
    return (
      <span className="mt-1 inline-flex w-fit items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
        {t(comment, locale)}
      </span>
    );
  }

  return <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{t(comment, locale)}</p>;
}
