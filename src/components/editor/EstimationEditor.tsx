"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ElixirSyncIntegrationState,
  EstimationRecord,
  EstimationState,
  EstimationStatus,
  StandardWorkstream,
  ThirdPartyIntegrationState,
} from "@/lib/types";
import { computeEstimationTotals } from "@/lib/calculations";
import { TopBar } from "./TopBar";
import { SummarySidebar } from "./SummarySidebar";
import { TabBar, type TabDef } from "./TabBar";
import { WorkstreamPanel } from "./WorkstreamPanel";
import { ThirdPartyPanel } from "./ThirdPartyPanel";
import { ElixirSyncPanel } from "./ElixirSyncPanel";
import { ProposalSummary } from "./ProposalSummary";

const PROPOSAL_TAB_ID = "proposal_summary";

interface Meta {
  clientName: string;
  projectName: string;
  ownerName: string;
  status: EstimationStatus;
}

function metaFromRecord(r: EstimationRecord): Meta {
  return {
    clientName: r.clientName,
    projectName: r.projectName ?? "",
    ownerName: r.ownerName ?? "",
    status: r.status,
  };
}

export function EstimationEditor({ initial }: { initial: EstimationRecord }) {
  const router = useRouter();
  const [meta, setMeta] = useState<Meta>(metaFromRecord(initial));
  const [data, setData] = useState<EstimationState>(initial.data);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>(initial.updatedAt);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => computeEstimationTotals(data), [data]);

  const tabs: TabDef[] = useMemo(
    () => [
      ...data.standardWorkstreams.map((ws) => ({ id: ws.key, label: ws.label })),
      { id: "third_party_integration", label: "Third Party Integration" },
      { id: "elixirsync_integration", label: "ElixirSync Integration" },
      { id: PROPOSAL_TAB_ID, label: "📄 Proposal Summary" },
    ],
    [data.standardWorkstreams]
  );
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");

  function markDirty() {
    setDirty(true);
  }

  function updateMeta(next: Partial<Meta>) {
    setMeta((prev) => ({ ...prev, ...next }));
    markDirty();
  }

  function updateWorkstream(key: string, next: StandardWorkstream) {
    setData((prev) => ({
      ...prev,
      standardWorkstreams: prev.standardWorkstreams.map((ws) => (ws.key === key ? next : ws)),
    }));
    markDirty();
  }

  function updateThirdParty(next: ThirdPartyIntegrationState) {
    setData((prev) => ({ ...prev, thirdPartyIntegration: next }));
    markDirty();
  }

  function updateElixirSync(next: ElixirSyncIntegrationState) {
    setData((prev) => ({ ...prev, elixirSyncIntegration: next }));
    markDirty();
  }

  function updatePm(next: Partial<Pick<EstimationState, "pmRate" | "pmPercent">>) {
    setData((prev) => ({ ...prev, ...next }));
    markDirty();
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/estimations/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: meta.clientName,
          projectName: meta.projectName,
          ownerName: meta.ownerName,
          status: meta.status,
          data,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ? JSON.stringify(body.error) : "Save failed");
      }
      const saved: EstimationRecord = await res.json();
      setLastSavedAt(saved.updatedAt);
      setDirty(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const activeWorkstream = data.standardWorkstreams.find((ws) => ws.key === activeTab);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <TopBar
        meta={meta}
        onChange={updateMeta}
        dirty={dirty}
        saving={saving}
        lastSavedAt={lastSavedAt}
        onSave={handleSave}
        error={error}
      />

      {activeTab === PROPOSAL_TAB_ID ? (
        <div className="mt-6">
          <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
          <div className="mt-4">
            <ProposalSummary meta={meta} data={data} />
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
            <div className="mt-4">
              {activeWorkstream && (
                <WorkstreamPanel
                  workstream={activeWorkstream}
                  onChange={(next) => updateWorkstream(activeWorkstream.key, next)}
                />
              )}
              {activeTab === "third_party_integration" && (
                <ThirdPartyPanel state={data.thirdPartyIntegration} onChange={updateThirdParty} />
              )}
              {activeTab === "elixirsync_integration" && (
                <ElixirSyncPanel
                  state={data.elixirSyncIntegration}
                  onChange={updateElixirSync}
                  hourlyRate={data.elixirSyncIntegration.hourlyRate}
                />
              )}
            </div>
          </div>

          <div>
            <SummarySidebar
              totals={totals}
              pmRate={data.pmRate}
              pmPercent={data.pmPercent}
              onChangePm={updatePm}
            />
          </div>
        </div>
      )}
    </div>
  );
}
