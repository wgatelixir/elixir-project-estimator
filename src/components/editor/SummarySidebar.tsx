"use client";

import type { EstimationTotals } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";

interface SummarySidebarProps {
  totals: EstimationTotals;
  pmRate: number;
  pmPercent: number;
  onChangePm: (next: { pmRate?: number; pmPercent?: number }) => void;
  onOpenProposal: () => void;
}

export function SummarySidebar({ totals, pmRate, pmPercent, onChangePm, onOpenProposal }: SummarySidebarProps) {
  return (
    <div className="sticky top-4 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-ink">Summary</h2>
        <dl className="mt-3 space-y-1.5 text-sm">
          {totals.workstreams
            .filter((w) => w.enabled)
            .map((w) => (
              <div key={w.key} className="flex items-center justify-between gap-2">
                <dt className="truncate text-slate-500">{w.label}</dt>
                <dd className="whitespace-nowrap tabular-nums text-slate-700">
                  {formatHours(w.hours)}
                </dd>
              </div>
            ))}
          {totals.thirdParty.enabled && (
            <div className="flex items-center justify-between gap-2">
              <dt className="truncate text-slate-500">{totals.thirdParty.label}</dt>
              <dd className="whitespace-nowrap tabular-nums text-slate-700">
                {formatHours(totals.thirdParty.hours)}
              </dd>
            </div>
          )}
          {totals.elixirSync.enabled && (
            <div className="flex items-center justify-between gap-2">
              <dt className="truncate text-slate-500">{totals.elixirSync.label}</dt>
              <dd className="whitespace-nowrap tabular-nums text-slate-700">
                {formatHours(totals.elixirSync.hours)}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Billable effort</span>
            <span className="tabular-nums font-medium text-brand-ink">
              {formatHours(totals.billableHours)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{formatCurrency(totals.billablePrice)}</span>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-slate-500">Project management</span>
            <span className="tabular-nums text-slate-700">{formatHours(totals.pmHours)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
            <span>PM %</span>
            <input
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={pmPercent}
              onChange={(e) => onChangePm({ pmPercent: Number(e.target.value) })}
              className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-right tabular-nums focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
            />
            <span>rate &euro;</span>
            <input
              type="number"
              min={0}
              value={pmRate}
              onChange={(e) => onChangePm({ pmRate: Number(e.target.value) })}
              className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-right tabular-nums focus:border-brand-indigo focus:outline-none focus:ring-1 focus:ring-brand-indigo"
            />
          </div>
        </div>

        {totals.subscriptions.some((s) => s.qty > 0) && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            {totals.subscriptions
              .filter((s) => s.qty > 0)
              .map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="truncate text-slate-500">{s.label}</span>
                  <span className="tabular-nums text-slate-700">{formatCurrency(s.price)}</span>
                </div>
              ))}
          </div>
        )}

        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-brand-ink">Total effort</span>
            <span className="tabular-nums font-medium text-brand-ink">
              {formatHours(totals.totalEffortHours)}
            </span>
          </div>
        </div>

        <div className="mt-2 rounded-md bg-brand-indigo p-3 text-white">
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-crimson">Grand total</div>
          <div className="text-xl font-semibold tabular-nums">
            {formatCurrency(totals.grandTotalPrice)}
          </div>
        </div>

        <button
          onClick={onOpenProposal}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-brand-indigo px-3 py-2 text-sm font-medium text-brand-indigo transition-colors hover:bg-brand-indigo hover:text-white"
        >
          📄 View Proposal Summary
        </button>
      </div>
    </div>
  );
}
