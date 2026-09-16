"use client";

import type {
  ElixirSyncIntegrationState,
  EstimationState,
  StandardWorkstream,
  ThirdPartyIntegrationState,
} from "@/lib/types";
import { computeEstimationTotals } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";
import { DEFAULT_HOURLY_RATES } from "@/lib/templates";
import { RateHint } from "./RateHint";

const FOUNDATION_KEYS = ["business_assessment", "technical_assessment", "data_migration", "deployment_golive"];
const HUB_KEYS = [
  "sales_implementation",
  "service_implementation",
  "marketing_implementation",
  "cms_implementation",
  "dealhub_implementation",
];

/** Live hours/price for a row, once its workstream is checked and worked out in its own tab - blank while unchecked so an all-zero row doesn't clutter the list. */
function ResultBadge({ enabled, hours, price }: { enabled: boolean; hours: number; price: number }) {
  if (!enabled) return null;
  return (
    <span className="min-w-[110px] text-right font-medium tabular-nums text-brand-ink">
      {formatHours(hours)} &middot; {formatCurrency(price)}
    </span>
  );
}

function WorkstreamRow({
  workstream,
  hours,
  price,
  onChange,
}: {
  workstream: StandardWorkstream;
  hours: number;
  price: number;
  onChange: (next: StandardWorkstream) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 hover:bg-slate-50">
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={workstream.enabled}
          onChange={(e) => onChange({ ...workstream, enabled: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 accent-brand-indigo"
        />
        <span className={`text-sm font-medium ${workstream.enabled ? "text-brand-ink" : "text-slate-400"}`}>
          {workstream.label}
        </span>
      </span>
      <span className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-2">
          <span className="font-medium text-slate-600">&euro;{workstream.hourlyRate}/h</span>
          <RateHint rate={workstream.hourlyRate} defaultRate={DEFAULT_HOURLY_RATES[workstream.key] ?? workstream.hourlyRate} />
        </span>
        <ResultBadge enabled={workstream.enabled} hours={hours} price={price} />
      </span>
    </label>
  );
}

function ToggleRow({
  label,
  rate,
  defaultRate,
  enabled,
  hours,
  price,
  onChange,
}: {
  label: string;
  rate: number;
  defaultRate: number;
  enabled: boolean;
  hours: number;
  price: number;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 hover:bg-slate-50">
      <span className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 accent-brand-indigo"
        />
        <span className={`text-sm font-medium ${enabled ? "text-brand-ink" : "text-slate-400"}`}>{label}</span>
      </span>
      <span className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-2">
          <span className="font-medium text-slate-600">&euro;{rate}/h</span>
          <RateHint rate={rate} defaultRate={defaultRate} />
        </span>
        <ResultBadge enabled={enabled} hours={hours} price={price} />
      </span>
    </label>
  );
}

function GroupCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="divide-y divide-slate-100 p-1.5">{children}</div>
    </div>
  );
}

interface CoverPageProps {
  data: EstimationState;
  onChangeWorkstream: (key: string, next: StandardWorkstream) => void;
  onChangeThirdParty: (next: ThirdPartyIntegrationState) => void;
  onChangeElixirSync: (next: ElixirSyncIntegrationState) => void;
}

export function CoverPage({ data, onChangeWorkstream, onChangeThirdParty, onChangeElixirSync }: CoverPageProps) {
  const byKey = (key: string) => data.standardWorkstreams.find((ws) => ws.key === key);
  const foundation = FOUNDATION_KEYS.map(byKey).filter((ws): ws is StandardWorkstream => !!ws);
  const hubs = HUB_KEYS.map(byKey).filter((ws): ws is StandardWorkstream => !!ws);

  const totals = computeEstimationTotals(data);
  const resultFor = (key: string) => totals.workstreams.find((w) => w.key === key);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-brand-ink">What are we offering?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose which HubSpot hubs and workstreams are part of this estimation. Unchecked items are excluded from
          the totals and hidden from the Proposal Summary, but stay saved here if you need them later.
        </p>
      </div>

      <GroupCard title="Foundation workstreams" description="Cross-cutting work that applies regardless of which hubs are in scope.">
        {foundation.map((ws) => (
          <WorkstreamRow
            key={ws.key}
            workstream={ws}
            hours={resultFor(ws.key)?.hours ?? 0}
            price={resultFor(ws.key)?.price ?? 0}
            onChange={(next) => onChangeWorkstream(ws.key, next)}
          />
        ))}
      </GroupCard>

      <GroupCard title="HubSpot hub implementations" description="The hubs this project will implement.">
        {hubs.map((ws) => (
          <WorkstreamRow
            key={ws.key}
            workstream={ws}
            hours={resultFor(ws.key)?.hours ?? 0}
            price={resultFor(ws.key)?.price ?? 0}
            onChange={(next) => onChangeWorkstream(ws.key, next)}
          />
        ))}
      </GroupCard>

      <GroupCard title="Integrations" description="Data sync and third-party connections, priced separately.">
        <ToggleRow
          label="ElixirSync Integration"
          rate={data.elixirSyncIntegration.hourlyRate}
          defaultRate={DEFAULT_HOURLY_RATES.elixirsync_integration}
          enabled={data.elixirSyncIntegration.enabled}
          hours={totals.elixirSync.hours}
          price={totals.elixirSync.price}
          onChange={(enabled) => onChangeElixirSync({ ...data.elixirSyncIntegration, enabled })}
        />
        <ToggleRow
          label="Third Party Integration"
          rate={data.thirdPartyIntegration.hourlyRate}
          defaultRate={DEFAULT_HOURLY_RATES.third_party_integration}
          enabled={data.thirdPartyIntegration.enabled}
          hours={totals.thirdParty.hours}
          price={totals.thirdParty.price}
          onChange={(enabled) => onChangeThirdParty({ ...data.thirdPartyIntegration, enabled })}
        />
      </GroupCard>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
        <span className="text-slate-500">Project management rate</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <span className="font-medium text-brand-ink">{formatCurrency(data.pmRate)}/h</span>
            <RateHint rate={data.pmRate} defaultRate={DEFAULT_HOURLY_RATES.pm} />
          </span>
          <span className="min-w-[110px] text-right text-xs font-medium tabular-nums text-brand-ink">
            {formatHours(totals.pmHours)} &middot; {formatCurrency(totals.pmPrice)}
          </span>
        </span>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-brand-indigo px-4 py-3 text-white shadow-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">Project total</div>
          <div className="text-xs text-white/70">{formatHours(totals.totalEffortHours)} total effort</div>
        </div>
        <div className="text-lg font-semibold tabular-nums">{formatCurrency(totals.grandTotalPrice)}</div>
      </div>
    </div>
  );
}
