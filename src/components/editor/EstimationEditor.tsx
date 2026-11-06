"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ElixirSyncIntegrationState,
  EstimationRecord,
  EstimationState,
  EstimationStatus,
  HubSpotLicenseState,
  Locale,
  OpportunityPhase,
  StandardWorkstream,
  ThirdPartyIntegrationState,
} from "@/lib/types";
import { computeEstimationTotals } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";
import { createDefaultHubSpotLicenseState } from "@/lib/hubspotPricing";
import { DEFAULT_SERVICE_RATE } from "@/lib/templates";
import { migrateLegacyLocaleFields } from "@/lib/migrateLegacyLocale";
import { isLegacyTemplate, upgradeToCurrentTemplate } from "@/lib/upgradeTemplate";
import { backfillTemplateLinks } from "@/lib/lineLinks";
import { refreshTemplateComments } from "@/lib/templateComments";
import { FEATURES } from "@/lib/features";
import { buildEstimationExport, exportFileBaseName } from "@/lib/export/model";
import { estimationToJson, estimationToXlsx } from "@/lib/export/exportEstimation";
import { complexityCommentsByBand, complexityHoursByBand } from "@/lib/style";
import { t, UI_STRINGS } from "@/lib/i18n";
import { TopBar } from "./TopBar";
import { SummarySidebar, type ActiveComplexityLegend } from "./SummarySidebar";
import { EditorNav, type NavGroup } from "./EditorNav";
import { CoverPage } from "./CoverPage";
import { OverviewPanel } from "./OverviewPanel";
import { WorkstreamPanel } from "./WorkstreamPanel";
import { ThirdPartyPanel } from "./ThirdPartyPanel";
import { ElixirSyncPanel } from "./ElixirSyncPanel";
import { HubSpotLicensePanel } from "./HubSpotLicensePanel";
import { ProposalSummary } from "./ProposalSummary";
import { FOUNDATION_KEYS, HUB_KEYS } from "@/lib/workstreamGroups";
import { isCustomWorkstream } from "@/lib/customWorkstreams";
import {
  Blocks,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Plug,
  Printer,
  Receipt,
  RefreshCw,
  Save,
  Wrench,
  iconProps,
} from "@/components/ui/icons";

const COVER_TAB_ID = "cover";
const OVERVIEW_TAB_ID = "overview";
const HUBSPOT_LICENSE_TAB_ID = "hubspot_license";
const PROPOSAL_TAB_ID = "proposal_summary";

// Migrates topic/label/comment fields saved before bilingual support
// existed (see migrateLegacyLocale.ts for why that needs a real template
// lookup, not just string-duplication), and backfills `hubspotLicense` /
// `locale` for estimations saved before those fields existed - rather than
// requiring another DB migration for fields that default to "not included"
// / "English" anyway.
function normalizeEstimationState(data: EstimationState): EstimationState {
  return {
    ...refreshTemplateComments(backfillTemplateLinks(migrateLegacyLocaleFields(data))),
    hubspotLicense: data.hubspotLicense ?? createDefaultHubSpotLicenseState(),
    locale: data.locale ?? "en",
    serviceRate: data.serviceRate ?? DEFAULT_SERVICE_RATE,
  };
}

interface Meta {
  clientName: string;
  projectName: string;
  ownerName: string;
  status: EstimationStatus;
  opportunityPhase: OpportunityPhase;
  closedWon: boolean;
  /** "" = no deadline set; otherwise an HTML date input value (YYYY-MM-DD). */
  closedWonDeadline: string;
}

function metaFromRecord(r: EstimationRecord): Meta {
  return {
    clientName: r.clientName,
    projectName: r.projectName ?? "",
    ownerName: r.ownerName ?? "",
    status: r.status,
    opportunityPhase: r.opportunityPhase,
    closedWon: r.closedWon,
    closedWonDeadline: r.closedWonDeadline ? r.closedWonDeadline.slice(0, 10) : "",
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
  const [justUpgraded, setJustUpgraded] = useState(false);

  const totals = useMemo(() => computeEstimationTotals(data), [data]);

  const topBarRef = useRef<HTMLDivElement>(null);
  const [topBarInView, setTopBarInView] = useState(true);
  useEffect(() => {
    const el = topBarRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setTopBarInView(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The Proposal Summary is reached via a button under the grand total in
  // the sidebar, not through this nav - keeping it out of `navGroups` keeps
  // the nav to Cover/Overview and workstreams only. Every standard
  // workstream and integration gets a row regardless of whether it's
  // currently in scope - its own checkbox includes/excludes it without
  // leaving the tab you're on - so the nav never changes shape, unlike the
  // old tab bar which only showed what Cover had already checked.
  const locale = data.locale;
  const byKey = (key: string) => data.standardWorkstreams.find((ws) => ws.key === key);
  // Not memoized: it closes over updateWorkstream/updateThirdParty/updateElixirSync,
  // which are plain functions redefined every render anyway (see below), so a
  // dependency array here would recompute on every render regardless.
  const navGroups: NavGroup[] = [
      {
        id: "fixed",
        items: [
          { id: COVER_TAB_ID, label: t(UI_STRINGS.editor.tabCover, locale), icon: FileText },
          { id: OVERVIEW_TAB_ID, label: t(UI_STRINGS.editor.tabOverview, locale), icon: LayoutDashboard },
          ...(FEATURES.hubspotLicense && data.hubspotLicense.enabled
            ? [{ id: HUBSPOT_LICENSE_TAB_ID, label: t(UI_STRINGS.editor.tabHubspotLicense, locale), icon: Receipt }]
            : []),
        ],
      },
      {
        id: "foundation",
        title: t(UI_STRINGS.coverPage.foundationTitle, locale),
        items: FOUNDATION_KEYS.map(byKey)
          .filter((ws): ws is StandardWorkstream => !!ws)
          .map((ws) => ({
            id: ws.key,
            label: t(ws.label, locale),
            hint: formatHours(totals.workstreams.find((w) => w.key === ws.key)?.hours ?? 0, locale),
            icon: ClipboardList,
            enabled: ws.enabled,
            onToggle: () => updateWorkstream(ws.key, { ...ws, enabled: !ws.enabled }),
          })),
      },
      {
        id: "hubs",
        title: t(UI_STRINGS.coverPage.hubsTitle, locale),
        items: HUB_KEYS.map(byKey)
          .filter((ws): ws is StandardWorkstream => !!ws)
          .map((ws) => ({
            id: ws.key,
            label: t(ws.label, locale),
            hint: formatHours(totals.workstreams.find((w) => w.key === ws.key)?.hours ?? 0, locale),
            icon: Blocks,
            enabled: ws.enabled,
            onToggle: () => updateWorkstream(ws.key, { ...ws, enabled: !ws.enabled }),
          })),
      },
      {
        id: "custom",
        title: t(UI_STRINGS.coverPage.customTitle, locale),
        items: data.standardWorkstreams.filter(isCustomWorkstream).map((ws) => ({
          id: ws.key,
          label: t(ws.label, locale),
          hint: formatHours(totals.workstreams.find((w) => w.key === ws.key)?.hours ?? 0, locale),
          icon: Wrench,
          enabled: ws.enabled,
          onToggle: () => updateWorkstream(ws.key, { ...ws, enabled: !ws.enabled }),
        })),
      },
      {
        id: "integrations",
        title: t(UI_STRINGS.coverPage.integrationsTitle, locale),
        items: [
          {
            id: "third_party_integration",
            label: t(UI_STRINGS.editor.tabThirdParty, locale),
            hint: formatHours(totals.thirdParty.hours, locale),
            icon: Plug,
            enabled: data.thirdPartyIntegration.enabled,
            onToggle: () => updateThirdParty({ ...data.thirdPartyIntegration, enabled: !data.thirdPartyIntegration.enabled }),
          },
          {
            id: "elixirsync_integration",
            label: t(UI_STRINGS.editor.tabElixirSync, locale),
            hint: formatHours(totals.elixirSync.hours, locale),
            icon: RefreshCw,
            enabled: data.elixirSyncIntegration.enabled,
            onToggle: () => updateElixirSync({ ...data.elixirSyncIntegration, enabled: !data.elixirSyncIntegration.enabled }),
          },
        ],
      },
    ];
  const [activeTab, setActiveTab] = useState(COVER_TAB_ID);

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

  function addWorkstream(ws: StandardWorkstream) {
    // Stays on the Cover page, where the new workstream's edit form opens; its tab appears in the bar.
    setData((prev) => ({ ...prev, standardWorkstreams: [...prev.standardWorkstreams, ws] }));
    markDirty();
  }

  function removeWorkstream(key: string) {
    setData((prev) => ({ ...prev, standardWorkstreams: prev.standardWorkstreams.filter((ws) => ws.key !== key) }));
    if (activeTab === key) setActiveTab(COVER_TAB_ID);
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

  // Bulk-reprices every standard workstream, Third Party Integration and
  // ElixirSync Integration still following the current serviceRate - an
  // onderdeel whose hourlyRate was already changed away from it (a
  // deliberate per-tab override) is left alone.
  function applyServiceRate(nextRate: number) {
    setData((prev) => {
      const follows = (rate: number) => rate === prev.serviceRate;
      return {
        ...prev,
        serviceRate: nextRate,
        standardWorkstreams: prev.standardWorkstreams.map((ws) =>
          follows(ws.hourlyRate) ? { ...ws, hourlyRate: nextRate } : ws
        ),
        thirdPartyIntegration: follows(prev.thirdPartyIntegration.hourlyRate)
          ? { ...prev.thirdPartyIntegration, hourlyRate: nextRate }
          : prev.thirdPartyIntegration,
        elixirSyncIntegration: follows(prev.elixirSyncIntegration.hourlyRate)
          ? { ...prev.elixirSyncIntegration, hourlyRate: nextRate }
          : prev.elixirSyncIntegration,
      };
    });
    markDirty();
  }

  function updateHubSpotLicense(next: HubSpotLicenseState) {
    setData((prev) => ({ ...prev, hubspotLicense: next }));
    markDirty();
  }

  function upgradeTemplate() {
    const s = UI_STRINGS.templateUpgrade;
    const next = upgradeToCurrentTemplate(data);
    const before = formatCurrency(totals.grandTotalPrice, locale);
    const after = formatCurrency(computeEstimationTotals(next).grandTotalPrice, locale);
    const message = [
      t(s.confirmIntro, locale),
      `${t(s.confirmTotals, locale)}: ${before} → ${after}`,
      ...(meta.status === "FINAL" ? [t(s.confirmFinal, locale)] : []),
      t(s.confirmUndo, locale),
    ].join("\n\n");
    if (!window.confirm(message)) return;
    setData(next);
    if (!next.standardWorkstreams.some((ws) => ws.key === activeTab) && data.standardWorkstreams.some((ws) => ws.key === activeTab)) {
      setActiveTab(COVER_TAB_ID);
    }
    setJustUpgraded(true);
    markDirty();
  }

  // Exports what's on screen (incl. unsaved edits), not the last saved version.
  function handleExport(format: "xlsx" | "json") {
    const exportMeta = { id: initial.id, ...meta };
    const model = buildEstimationExport(exportMeta, data);
    const blob =
      format === "xlsx"
        ? new Blob([estimationToXlsx(model) as BlobPart], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
        : new Blob([estimationToJson(model)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileBaseName(exportMeta)}.${format}`;
    link.click();
    // Released a moment later: revoking synchronously can cancel the download in Safari.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
          opportunityPhase: meta.opportunityPhase,
          closedWon: meta.closedWon,
          closedWonDeadline: meta.closedWonDeadline || null,
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

  // Ctrl/Cmd+S saves (instead of the browser's "save page"), and leaving the page
  // with unsaved changes asks first. The ref keeps the key handler on the latest save.
  const saveRef = useRef(handleSave);
  useEffect(() => {
    saveRef.current = handleSave;
  });
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

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
      <div ref={topBarRef}>
        <TopBar
          estimationId={initial.id}
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
      </div>

      {isLegacyTemplate(data) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 print:hidden">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-amber-900">{t(UI_STRINGS.templateUpgrade.bannerTitle, locale)}</div>
            <p className="mt-0.5 text-xs text-amber-800">{t(UI_STRINGS.templateUpgrade.bannerBody, locale)}</p>
          </div>
          <button
            onClick={upgradeTemplate}
            className="btn btn-primary flex-shrink-0"
          >
            {t(UI_STRINGS.templateUpgrade.button, locale)}
          </button>
        </div>
      )}
      {justUpgraded && dirty && (
        <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 print:hidden">
          <div className="text-sm font-semibold text-sky-900">{t(UI_STRINGS.templateUpgrade.doneTitle, locale)}</div>
          <p className="mt-0.5 text-xs text-sky-800">{t(UI_STRINGS.templateUpgrade.doneBody, locale)}</p>
        </div>
      )}

      {activeTab === PROPOSAL_TAB_ID ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[252px_minmax(0,1fr)]">
          <div className="print:hidden">
            <EditorNav groups={navGroups} active={activeTab} onChange={setActiveTab} />
          </div>
          <div className="min-w-0">
            <div className="flex justify-end print:hidden">
              <button onClick={() => window.print()} className="btn btn-primary flex-shrink-0">
                <Printer {...iconProps} />
                {t(UI_STRINGS.editor.downloadPdf, locale)}
              </button>
            </div>
            <div className="mt-4">
              <ProposalSummary meta={meta} data={data} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[252px_minmax(0,1fr)_320px]">
          <div className="print:hidden">
            <EditorNav groups={navGroups} active={activeTab} onChange={setActiveTab} />
          </div>
          <div className="min-w-0">
            {/* Floats in once there's something unsaved and the top bar (with its own Save) has scrolled away. */}
            {dirty && !topBarInView && (
              <div className="sticky top-0 z-20 mb-3 flex justify-end print:hidden">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  title={t(UI_STRINGS.topBar.saveShortcut, locale)}
                  className="btn btn-primary flex-shrink-0 shadow-sm"
                >
                  <Save {...iconProps} />
                  {saving ? t(UI_STRINGS.topBar.saving, locale) : t(UI_STRINGS.topBar.save, locale)}
                </button>
              </div>
            )}
            <div>
              {activeTab === COVER_TAB_ID && (
                <CoverPage
                  data={data}
                  onChangeWorkstream={updateWorkstream}
                  onAddWorkstream={addWorkstream}
                  onRemoveWorkstream={removeWorkstream}
                  onChangeThirdParty={updateThirdParty}
                  onChangeElixirSync={updateElixirSync}
                  onChangeHubSpotLicense={updateHubSpotLicense}
                  onChangePm={updatePm}
                  onApplyServiceRate={applyServiceRate}
                  locale={locale}
                />
              )}
              {activeTab === OVERVIEW_TAB_ID && <OverviewPanel totals={totals} locale={locale} />}
              {activeTab === HUBSPOT_LICENSE_TAB_ID && (
                <HubSpotLicensePanel state={data.hubspotLicense} onChange={updateHubSpotLicense} locale={locale} />
              )}
              {activeWorkstream && (
                <WorkstreamPanel
                  key={activeWorkstream.key}
                  workstream={activeWorkstream}
                  onChange={(next) => updateWorkstream(activeWorkstream.key, next)}
                  pmPercent={data.pmPercent}
                  pmRate={data.pmRate}
                  locale={locale}
                />
              )}
              {activeTab === "third_party_integration" && (
                <ThirdPartyPanel
                  state={data.thirdPartyIntegration}
                  onChange={updateThirdParty}
                  pmPercent={data.pmPercent}
                  pmRate={data.pmRate}
                  locale={locale}
                />
              )}
              {activeTab === "elixirsync_integration" && (
                <ElixirSyncPanel
                  state={data.elixirSyncIntegration}
                  onChange={updateElixirSync}
                  hourlyRate={data.elixirSyncIntegration.hourlyRate}
                  pmPercent={data.pmPercent}
                  pmRate={data.pmRate}
                  locale={locale}
                />
              )}
            </div>
          </div>

          <div>
            <SummarySidebar
              totals={totals}
              onOpenProposal={() => setActiveTab(PROPOSAL_TAB_ID)}
              onExport={handleExport}
              legend={sidebarLegend}
              locale={locale}
            />
          </div>
        </div>
      )}
    </div>
  );
}
