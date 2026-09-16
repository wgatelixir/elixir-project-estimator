"use client";

import type {
  ElixirSyncIntegrationState,
  EstimationState,
  StandardWorkstream,
  ThirdPartyIntegrationState,
} from "@/lib/types";
import { formatCurrency } from "@/lib/format";

const FOUNDATION_KEYS = ["business_assessment", "technical_assessment", "data_migration", "deployment_golive"];
const HUB_KEYS = [
  "sales_implementation",
  "service_implementation",
  "marketing_implementation",
  "cms_implementation",
  "dealhub_implementation",
];

function WorkstreamRow({
  workstream,
  onChange,
}: {
  workstream: StandardWorkstream;
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
      <span className="text-xs text-slate-400">&euro;{workstream.hourlyRate}/h</span>
    </label>
  );
}

function ToggleRow({
  label,
  rate,
  enabled,
  onChange,
}: {
  label: string;
  rate: number;
  enabled: boolean;
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
      <span className="text-xs text-slate-400">&euro;{rate}/h</span>
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
          <WorkstreamRow key={ws.key} workstream={ws} onChange={(next) => onChangeWorkstream(ws.key, next)} />
        ))}
      </GroupCard>

      <GroupCard title="HubSpot hub implementations" description="The hubs this project will implement.">
        {hubs.map((ws) => (
          <WorkstreamRow key={ws.key} workstream={ws} onChange={(next) => onChangeWorkstream(ws.key, next)} />
        ))}
      </GroupCard>

      <GroupCard title="Integrations" description="Data sync and third-party connections, priced separately.">
        <ToggleRow
          label="ElixirSync Integration"
          rate={data.elixirSyncIntegration.hourlyRate}
          enabled={data.elixirSyncIntegration.enabled}
          onChange={(enabled) => onChangeElixirSync({ ...data.elixirSyncIntegration, enabled })}
        />
        <ToggleRow
          label="Third Party Integration"
          rate={data.thirdPartyIntegration.hourlyRate}
          enabled={data.thirdPartyIntegration.enabled}
          onChange={(enabled) => onChangeThirdParty({ ...data.thirdPartyIntegration, enabled })}
        />
      </GroupCard>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
        <span className="text-slate-500">Default project management rate</span>
        <span className="font-medium text-brand-ink">{formatCurrency(data.pmRate)}/h</span>
      </div>
    </div>
  );
}
