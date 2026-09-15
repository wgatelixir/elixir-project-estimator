"use client";

import type { EstimationTotals } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";

interface SummarySidebarProps {
  totals: EstimationTotals;
  pmRate: number;
  pmPercent: number;
  onChangePm: (next: { pmRate?: number; pmPercent?: number }) => void;
}

export function SummarySidebar({ totals, pmRate, pmPercent, onChangePm }: SummarySidebarProps) {
  return (
    <div className="sticky top-4 space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
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
            <span className="tabular-nums font-medium text-slate-900">
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
              className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-right tabular-nums"
            />
            <span>rate &euro;</span>
            <input
              type="number"
              min={0}
              value={pmRate}
              onChange={(e) => onChangePm({ pmRate: Number(e.target.value) })}
              className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-right tabular-nums"
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
            <span className="font-medium text-slate-900">Total effort</span>
            <span className="tabular-nums font-medium text-slate-900">
              {formatHours(totals.totalEffortHours)}
            </span>
          </div>
        </div>

        <div className="mt-2 rounded-md bg-slate-900 p-3 text-white">
          <div className="text-xs uppercase tracking-wide text-slate-300">Grand total</div>
          <div className="text-xl font-semibold tabular-nums">
            {formatCurrency(totals.grandTotalPrice)}
          </div>
        </div>
      </div>
    </div>
  );
}
