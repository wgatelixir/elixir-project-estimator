/**
 * Renders a StandardLineItem/ThirdPartyLineItem's free-text `comment`, straight from the
 * source spreadsheet's own Comment column (e.g. deliverable notes, "Only for
 * uni-dimensional projects" scope tags). A dimension tag gets a small badge
 * since it's a scope rule to act on, not just descriptive text.
 */
export function LineItemNote({ comment }: { comment?: string | null }) {
  if (!comment) return null;

  const isDimensionTag = /^only for /i.test(comment);
  if (isDimensionTag) {
    return (
      <span className="mt-1 inline-flex w-fit items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
        {comment}
      </span>
    );
  }

  return <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{comment}</p>;
}
