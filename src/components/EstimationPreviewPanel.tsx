"use client";

import Link from "next/link";
import type { EstimationSummary } from "@/lib/types";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { OpportunityPhaseBadge } from "@/components/OpportunityPhaseBadge";
import { EstimationRowActions } from "@/components/EstimationRowActions";
import { Check, X, iconProps } from "@/components/ui/icons";

/**
 * HubSpot-style quick-view: click a board card and its key properties slide
 * in from the right instead of navigating away, with the full editor just
 * one click further (via "Open estimation") for whoever wants to dig in.
 */
export function EstimationPreviewPanel({
  estimation,
  onClose,
}: {
  estimation: EstimationSummary;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-brand-ink/30" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-brand-ink">{estimation.clientName}</div>
            <div className="truncate text-sm text-slate-500">{estimation.projectName || "—"}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close preview">
            <X {...iconProps} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={estimation.status} />
            <OpportunityPhaseBadge phase={estimation.opportunityPhase} />
          </div>

          {estimation.closedWon && (
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              <Check {...iconProps} />
              Closed Won
              {estimation.closedWonDeadline ? ` · deadline ${formatDate(estimation.closedWonDeadline)}` : ""}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Owner</dt>
              <dd className="mt-0.5 font-medium text-brand-ink">{estimation.ownerName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Hours</dt>
              <dd className="mt-0.5 font-medium text-brand-ink">{formatHours(estimation.totalHours)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Last updated</dt>
              <dd className="mt-0.5 font-medium text-brand-ink">{formatDate(estimation.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Created</dt>
              <dd className="mt-0.5 font-medium text-brand-ink">{formatDate(estimation.createdAt)}</dd>
            </div>
          </dl>

          <div className="rounded-lg bg-brand-indigo p-4 text-white">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/80">Grand total</div>
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(estimation.totalPrice)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4">
          <EstimationRowActions id={estimation.id} clientName={estimation.clientName} />
          <Link href={`/estimations/${estimation.id}`} className="btn btn-primary">
            Open estimation
          </Link>
        </div>
      </div>
    </>
  );
}
