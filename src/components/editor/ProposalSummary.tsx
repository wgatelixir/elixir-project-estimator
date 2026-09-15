"use client";

import Image from "next/image";
import type { EstimationState, EstimationStatus } from "@/lib/types";
import { computeEstimationTotals, lineItemFinalEffort, thirdPartyLineItemHours } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";
import {
  ACTIVITY_STYLES,
  classifyActivity,
  classifyComplexity,
  COMPLEXITY_STYLES,
} from "@/lib/style";
import { PanelLegend } from "./Legend";

interface Meta {
  clientName: string;
  projectName: string;
  ownerName: string;
  status: EstimationStatus;
}

function ActivityPill({ activity }: { activity: string }) {
  const style = ACTIVITY_STYLES[classifyActivity(activity)];
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${style.badge}`}>
      {activity}
    </span>
  );
}

function ComplexityPill({ level }: { level: string }) {
  const style = COMPLEXITY_STYLES[classifyComplexity(level)];
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${style.badge}`}>
      {level}
    </span>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-baseline justify-between gap-3 bg-brand-indigo px-4 py-2.5 text-white">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <span className="text-xs text-white/80">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

export function ProposalSummary({ meta, data }: { meta: Meta; data: EstimationState }) {
  const totals = computeEstimationTotals(data);
  const generatedOn = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const enabledWorkstreams = data.standardWorkstreams.filter((ws) => ws.enabled);
  const thirdParty = data.thirdPartyIntegration;
  const elixirSync = data.elixirSyncIntegration;
  const includedStreams = elixirSync.streams.filter((s) => s.included);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <Image src="/elixir-logo.png" alt="Elixir" width={95} height={32} className="mb-3" />
          <h2 className="text-xl font-semibold text-brand-ink">{meta.clientName || "Untitled client"}</h2>
          {meta.projectName && <p className="text-sm text-slate-500">{meta.projectName}</p>}
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>Generated {generatedOn}</div>
          {meta.ownerName && <div>Prepared by {meta.ownerName}</div>}
          <div className="mt-1 font-medium uppercase tracking-wide text-brand-indigo">{meta.status}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <PanelLegend />
      </div>

      {enabledWorkstreams.map((ws) => {
        const items = ws.items.filter((item) => item.enabled);
        const hours = items.reduce((sum, item) => sum + lineItemFinalEffort(item, ws), 0);
        return (
          <SectionCard
            key={ws.key}
            title={ws.label}
            subtitle={`${formatHours(hours)} · ${formatCurrency(hours * ws.hourlyRate)}`}
          >
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Activity</th>
                  <th className="px-4 py-2 font-medium">Topic</th>
                  <th className="px-4 py-2 text-right font-medium">Standard</th>
                  <th className="px-4 py-2 font-medium">Complexity</th>
                  <th className="px-4 py-2 text-right font-medium">Final effort</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      <ActivityPill activity={item.activity} />
                    </td>
                    <td className="px-4 py-2 text-brand-ink">{item.topic}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{item.standardEffort}</td>
                    <td className="px-4 py-2">
                      <ComplexityPill level={item.complexity} />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-brand-ink">
                      {formatHours(lineItemFinalEffort(item, ws))}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                      No line items in this workstream.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
                  <td className="px-4 py-2" colSpan={4}>
                    Total
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatHours(hours)}</td>
                </tr>
              </tfoot>
            </table>
          </SectionCard>
        );
      })}

      {thirdParty.enabled && (
        <SectionCard
          title="Third Party Integration"
          subtitle={`${formatHours(totals.thirdParty.hours)} · ${formatCurrency(totals.thirdParty.price)}`}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Activity</th>
                <th className="px-4 py-2 font-medium">Topic</th>
                <th className="px-4 py-2 font-medium">From</th>
                <th className="px-4 py-2 font-medium">To</th>
                <th className="px-4 py-2 font-medium">Complexity</th>
                <th className="px-4 py-2 text-right font-medium">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {thirdParty.items
                .filter((item) => item.enabled)
                .map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      <ActivityPill activity={item.activity} />
                    </td>
                    <td className="px-4 py-2 text-brand-ink">{item.topic}</td>
                    <td className="px-4 py-2 text-slate-600">{item.from || "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{item.to || "—"}</td>
                    <td className="px-4 py-2">
                      <ComplexityPill level={item.complexity} />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-brand-ink">
                      {formatHours(thirdPartyLineItemHours(item, thirdParty))}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
                <td className="px-4 py-2" colSpan={5}>
                  Total
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{formatHours(totals.thirdParty.hours)}</td>
              </tr>
            </tfoot>
          </table>
        </SectionCard>
      )}

      {elixirSync.enabled && (
        <SectionCard
          title="ElixirSync Integration"
          subtitle={`${formatHours(totals.elixirSync.hours)} · ${formatCurrency(totals.elixirSync.price)}`}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Stream</th>
                <th className="px-4 py-2 text-right font-medium">Realistic effort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {includedStreams.map((stream) => {
                const hours = stream.items.reduce((sum, item) => sum + item.realistic, 0);
                return (
                  <tr key={stream.id}>
                    <td className="px-4 py-2 text-brand-ink">{stream.label}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-brand-ink">
                      {formatHours(hours)}
                    </td>
                  </tr>
                );
              })}
              {includedStreams.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-slate-400">
                    No streams selected.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-brand-ink">
                <td className="px-4 py-2">Total</td>
                <td className="px-4 py-2 text-right tabular-nums">{formatHours(totals.elixirSync.hours)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
            Technical task-level breakdown is available on the ElixirSync Integration tab.
          </p>
        </SectionCard>
      )}

      <SectionCard title="Overview">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Workstream</th>
              <th className="px-4 py-2 text-right font-medium">Hours</th>
              <th className="px-4 py-2 text-right font-medium">Rate</th>
              <th className="px-4 py-2 text-right font-medium">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {totals.workstreams
              .filter((w) => w.enabled)
              .map((w) => (
                <tr key={w.key}>
                  <td className="px-4 py-2 text-brand-ink">{w.label}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatHours(w.hours)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                    {formatCurrency(w.hourlyRate)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-brand-ink">
                    {formatCurrency(w.price)}
                  </td>
                </tr>
              ))}
            {totals.thirdParty.enabled && (
              <tr>
                <td className="px-4 py-2 text-brand-ink">{totals.thirdParty.label}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                  {formatHours(totals.thirdParty.hours)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                  {formatCurrency(totals.thirdParty.hourlyRate)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium text-brand-ink">
                  {formatCurrency(totals.thirdParty.price)}
                </td>
              </tr>
            )}
            {totals.elixirSync.enabled && (
              <tr>
                <td className="px-4 py-2 text-brand-ink">{totals.elixirSync.label}</td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                  {formatHours(totals.elixirSync.hours)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                  {formatCurrency(totals.elixirSync.hourlyRate)}
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-medium text-brand-ink">
                  {formatCurrency(totals.elixirSync.price)}
                </td>
              </tr>
            )}
            <tr>
              <td className="px-4 py-2 text-brand-ink">Project management</td>
              <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatHours(totals.pmHours)}</td>
              <td className="px-4 py-2 text-right tabular-nums text-slate-600">{formatCurrency(totals.pmRate)}</td>
              <td className="px-4 py-2 text-right tabular-nums font-medium text-brand-ink">
                {formatCurrency(totals.pmPrice)}
              </td>
            </tr>
            {totals.subscriptions
              .filter((s) => s.qty > 0)
              .map((s) => (
                <tr key={s.label}>
                  <td className="px-4 py-2 text-brand-ink" colSpan={3}>
                    {s.label} ({s.qty}&times;)
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-brand-ink">
                    {formatCurrency(s.price)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between bg-brand-indigo px-4 py-4 text-white">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-crimson">Grand total</div>
            <div className="text-xs text-white/70">{formatHours(totals.totalEffortHours)} total effort</div>
          </div>
          <div className="text-2xl font-semibold tabular-nums">{formatCurrency(totals.grandTotalPrice)}</div>
        </div>
      </SectionCard>
    </div>
  );
}
