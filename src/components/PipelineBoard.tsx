import Link from "next/link";
import type { EstimationSummary } from "@/lib/types";
import { OPPORTUNITY_PHASES } from "@/lib/types";
import { OPPORTUNITY_PHASE_STYLES } from "@/lib/style";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Check, iconProps } from "@/components/ui/icons";

function initial(name: string | null) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

function PipelineCard({ e }: { e: EstimationSummary }) {
  return (
    <Link
      href={`/estimations/${e.id}`}
      className={`block rounded-lg border bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        e.closedWon ? "border-emerald-200 border-l-4 border-l-emerald-400" : "border-slate-200 hover:border-brand-indigo/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-brand-ink">{e.clientName}</div>
          <div className="truncate text-xs text-slate-500">{e.projectName || "—"}</div>
        </div>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-indigo/10 text-[11px] font-semibold text-brand-indigo"
          title={e.ownerName ? `Owner: ${e.ownerName}` : "No owner set"}
        >
          {initial(e.ownerName)}
        </span>
      </div>

      {e.closedWon && (
        <span className="mt-2 inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
          <Check {...iconProps} size={11} />
          Closed Won{e.closedWonDeadline ? ` · ${formatDate(e.closedWonDeadline)}` : ""}
        </span>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusBadge status={e.status} />
        <span className="text-xs text-slate-400">{formatHours(e.totalHours)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="text-[11px] text-slate-400">{formatDate(e.updatedAt)}</span>
        <span className="text-sm font-bold text-brand-indigo">{formatCurrency(e.totalPrice)}</span>
      </div>
    </Link>
  );
}

/**
 * HubSpot-deals-board-style pipeline: one column per opportunity phase (see
 * OPPORTUNITY_PHASES), each headed by its deal count and total price - the
 * same at-a-glance stage math HubSpot's own Deals board shows. Closed Won
 * estimations get a green accent regardless of which phase column they sit
 * in, since that flag is tracked independently of phase (see types.ts).
 */
export function PipelineBoard({ estimations }: { estimations: EstimationSummary[] }) {
  if (estimations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-4 py-16 text-center text-sm text-slate-400">
        No estimations yet — create the first one.
      </div>
    );
  }

  const byPhase = new Map<string, EstimationSummary[]>(OPPORTUNITY_PHASES.map((p) => [p, []]));
  for (const e of estimations) {
    byPhase.get(e.opportunityPhase)?.push(e);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {OPPORTUNITY_PHASES.map((phase) => {
        const style = OPPORTUNITY_PHASE_STYLES[phase];
        const items = byPhase.get(phase) ?? [];
        const total = items.reduce((sum, e) => sum + e.totalPrice, 0);
        return (
          <div key={phase} className="flex w-72 shrink-0 flex-col">
            <div className="flex items-center justify-between gap-2 px-0.5 pb-2">
              <span className="flex items-center gap-1.5 truncate text-xs font-semibold uppercase tracking-wide text-slate-600">
                <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                {style.label.en}
              </span>
              <span className="shrink-0 text-[11px] text-slate-400">{items.length}</span>
            </div>
            <div className="rounded-md border border-slate-200 bg-brand-mist px-2 py-1.5 text-xs font-semibold text-slate-600">
              {formatCurrency(total)}
            </div>
            <div className="mt-2 max-h-[calc(100vh-420px)] min-h-[80px] space-y-2 overflow-y-auto pr-0.5 pb-1">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-[11px] text-slate-300">
                  No estimations
                </div>
              ) : (
                items.map((e) => <PipelineCard key={e.id} e={e} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
