"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ElixirSyncIntegrationState,
  EstimationRecord,
  EstimationState,
  EstimationStatus,
  HubSpotLicenseState,
  Locale,
  StandardWorkstream,
  ThirdPartyIntegrationState,
} from "@/lib/types";
import { computeEstimationTotals } from "@/lib/calculations";
import { createDefaultHubSpotLicenseState } from "@/lib/hubspotPricing";
import { complexityCommentsByBand, complexityHoursByBand } from "@/lib/style";
import { t, UI_STRINGS } from "@/lib/i18n";
import { TopBar } from "./TopBar";
import { SummarySidebar, type ActiveComplexityLegend } from "./SummarySidebar";
import { TabBar, type TabDef } from "./TabBar";
import { CoverPage } from "./CoverPage";
import { WorkstreamPanel } from "./WorkstreamPanel";
import { ThirdPartyPanel } from "./ThirdPartyPanel";
import { ElixirSyncPanel } from "./ElixirSyncPanel";
import { HubSpotLicensePanel } from "./HubSpotLicensePanel";
import { ProposalSummary } from "./ProposalSummary";

const COVER_TAB_ID = "cover";
const HUBSPOT_LICENSE_TAB_ID = "hubspot_license";
const PROPOSAL_TAB_ID = "proposal_summary";

// Estimations saved before the HubSpot License tab / bilingual support
// existed have no `hubspotLicense` / `locale` field in their stored data -
// fill both in client-side rather than requiring another DB backfill for
// fields that default to "not included" / "English" anyway.
function normalizeEstimationState(data: EstimationState): EstimationState {
  if (data.hubspotLicense && data.locale) return data;
  return {
    ...data,
    hubspotLicense: data.hubspotLicense ?? createDefaultHubSpotLicenseState(),
    locale: data.locale ?? "en",
  };
}

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
  const [data, setData] = useState<EstimationState>(() => normalizeEstimationState(initial.data));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>(initial.updatedAt);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => computeEstimationTotals(data), [data]);

  // The Proposal Summary is reached via a button under the grand total in
  // the sidebar, not through this tab bar - keeping it out of `tabs` keeps
  // the bar to workstreams only. Only workstreams/integrations checked on
  // the Cover page get a tab, so the bar always matches what's in scope.
  const locale = data.locale;
  const tabs: TabDef[] = useMemo(
    () => [
      { id: COVER_TAB_ID, label: t(UI_STRINGS.editor.tabCover, locale) },
      { id: HUBSPOT_LICENSE_TAB_ID, label: t(UI_STRINGS.editor.tabHubspotLicense, locale) },
      ...data.standardWorkstreams.filter((ws) => ws.enabled).map((ws) => ({ id: ws.key, label: t(ws.label, locale) })),
      ...(data.thirdPartyIntegration.enabled
        ? [{ id: "third_party_integration", label: t(UI_STRINGS.editor.tabThirdParty, locale) }]
        : []),
      ...(data.elixirSyncIntegration.enabled
        ? [{ id: "elixirsync_integration", label: t(UI_STRINGS.editor.tabElixirSync, locale) }]
        : []),
    ],
    [data.standardWorkstreams, data.thirdPartyIntegration.enabled, data.elixirSyncIntegration.enabled, locale]
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

  function updateHubSpotLicense(next: HubSpotLicenseState) {
    setData((prev) => ({ ...prev, hubspotLicense: next }));
    markDirty();
  }

  function updateLocale(next: Locale) {
    setData((prev) => ({ ...prev, locale: next }));
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

  // Drives the "Complexity guide" block in the sticky sidebar, so it stays
  // visible while scrolling a long workstream. Undefined on tabs with no
  // complexity system of their own (Cover, ElixirSync).
  let sidebarLegend: ActiveComplexityLegend | undefined;
  if (activeWorkstream) {
    sidebarLegend = {
      label: activeWorkstream.label,
      variant: "standard",
      sessionHours: complexityHoursByBand(activeWorkstream.sessionComplexity),
      setupHours: complexityHoursByBand(activeWorkstream.setupComplexity),
      comments: complexityCommentsByBand(activeWorkstream.sessionComplexity),
    };
  } else if (activeTab === "third_party_integration") {
    sidebarLegend = {
      label: UI_STRINGS.editor.tabThirdParty,
      variant: "thirdParty",
      sessionHours: complexityHoursByBand(data.thirdPartyIntegration.sessionComplexity),
      setupHours: complexityHoursByBand(data.thirdPartyIntegration.setupComplexity),
      comments: complexityCommentsByBand(data.thirdPartyIntegration.sessionComplexity),
    };
  }

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
        locale={locale}
        onChangeLocale={updateLocale}
      />

      {activeTab === PROPOSAL_TAB_ID ? (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <div className="min-w-0 flex-1">
              <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
            </div>
            <button
              onClick={() => window.print()}
              className="flex-shrink-0 rounded-md bg-brand-indigo px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-indigo-hover"
            >
              {t(UI_STRINGS.editor.downloadPdf, locale)}
            </button>
          </div>
          <div className="mt-4">
            <ProposalSummary meta={meta} data={data} />
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
            <div className="mt-4">
              {activeTab === COVER_TAB_ID && (
                <CoverPage
                  data={data}
                  onChangeWorkstream={updateWorkstream}
                  onChangeThirdParty={updateThirdParty}
                  onChangeElixirSync={updateElixirSync}
                  locale={locale}
                />
              )}
              {activeTab === HUBSPOT_LICENSE_TAB_ID && (
                <HubSpotLicensePanel state={data.hubspotLicense} onChange={updateHubSpotLicense} locale={locale} />
              )}
              {activeWorkstream && (
                <WorkstreamPanel
                  workstream={activeWorkstream}
                  onChange={(next) => updateWorkstream(activeWorkstream.key, next)}
                  locale={locale}
                />
              )}
              {activeTab === "third_party_integration" && (
                <ThirdPartyPanel state={data.thirdPartyIntegration} onChange={updateThirdParty} locale={locale} />
              )}
              {activeTab === "elixirsync_integration" && (
                <ElixirSyncPanel
                  state={data.elixirSyncIntegration}
                  onChange={updateElixirSync}
                  hourlyRate={data.elixirSyncIntegration.hourlyRate}
                  locale={locale}
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
              onOpenProposal={() => setActiveTab(PROPOSAL_TAB_ID)}
              legend={sidebarLegend}
              locale={locale}
            />
          </div>
        </div>
      )}
    </div>
  );
}
