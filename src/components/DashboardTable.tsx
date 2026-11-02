import { Check, iconProps } from "@/components/ui/icons";
import type { EstimationSummary } from "@/lib/types";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { EstimationRowActions } from "@/components/EstimationRowActions";
import { StatusBadge } from "@/components/StatusBadge";
import { OpportunityPhaseBadge } from "@/components/OpportunityPhaseBadge";

/** The dense, sortable-by-eye list view - same data as the Board, for exporting, scanning owners, or acting on a row (duplicate/delete/history). */
export function DashboardTable({ estimations, q }: { estimations: EstimationSummary[]; q?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-brand-mist text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Opportunity phase</th>
            <th className="px-4 py-3 font-medium">Closed Won</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 text-right font-medium">Hours</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Last updated</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {estimations.length === 0 && (
            <tr>
              <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                {q ? "No estimations match your search." : "No estimations yet — create the first one."}
              </td>
            </tr>
          )}
          {estimations.map((e) => (
            <tr key={e.id} className="transition-colors hover:bg-brand-indigo/[0.03]">
              <td className="px-4 py-3">
                <a
                  href={`/estimations/${e.id}`}
                  className="font-semibold text-brand-indigo transition-colors hover:text-brand-crimson"
                >
                  {e.clientName}
                </a>
              </td>
              <td className="px-4 py-3 text-slate-600">{e.projectName || "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={e.status} />
              </td>
              <td className="px-4 py-3">
                <OpportunityPhaseBadge phase={e.opportunityPhase} />
              </td>
              <td className="px-4 py-3">
                {e.closedWon ? (
                  <span className="inline-flex flex-col text-xs">
                    <span className="inline-flex w-fit items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                      <Check {...iconProps} size={12} />
                      Closed Won
                    </span>
                    {e.closedWonDeadline && (
                      <span className="mt-0.5 text-slate-400">{formatDate(e.closedWonDeadline)}</span>
                    )}
                  </span>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{e.ownerName || "—"}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatHours(e.totalHours)}</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-ink">
                {formatCurrency(e.totalPrice)}
              </td>
              <td className="px-4 py-3 text-slate-500">{formatDate(e.updatedAt)}</td>
              <td className="px-4 py-3">
                <EstimationRowActions id={e.id} clientName={e.clientName} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
