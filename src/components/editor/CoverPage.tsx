"use client";

import { Pencil, Plus, iconProps } from "@/components/ui/icons";
import type {
  ElixirSyncIntegrationState,
  EstimationState,
  HubSpotLicenseState,
  Locale,
  CustomWorkstreamType,
  DealStage,
  LocalizedString,
  ProjectPhase,
  StandardWorkstream,
  ThirdPartyIntegrationState,
} from "@/lib/types";
import { computeEstimationTotals } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";
import { DEFAULT_HOURLY_RATES } from "@/lib/templates";
import { t, UI_STRINGS } from "@/lib/i18n";
import { RateHint } from "./RateHint";
import { FEATURES } from "@/lib/features";
import {
  CUSTOM_WORKSTREAM_TYPES,
  CUSTOM_WORKSTREAM_TYPE_LABELS,
  DEFAULT_RETAINER_MONTHS,
  createCustomWorkstream,
  isCustomWorkstream,
} from "@/lib/customWorkstreams";
import { useState } from "react";
import { Rulebook } from "./Rulebook";
import { FOUNDATION_KEYS, HUB_KEYS } from "@/lib/workstreamGroups";

// One fixed column template shared by the header and every row, so Rate/Hours/Budget
// never drift out of alignment regardless of label length or whether a row has a result yet.
const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_92px_124px_190px_90px_120px] items-center gap-3";

const PHASES: ProjectPhase[] = [1, 2, 3];

function ColumnHeader({ locale }: { locale: Locale }) {
  const s = UI_STRINGS.coverPage;
  return (
    <div className={`${ROW_GRID} px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400`}>
      <span>{t(s.columnWorkstream, locale)}</span>
      <span>{t(s.columnPhase, locale)}</span>
      <span>{t(s.columnStage, locale)}</span>
      <span className="text-right">{t(s.columnRate, locale)}</span>
      <span className="text-right">{t(s.columnHours, locale)}</span>
      <span className="text-right">{t(s.columnBudget, locale)}</span>
    </div>
  );
}

/** Kept selectable while a row is unchecked, so a phase can be planned before it's in scope. */
function PhaseSelect({
  phase,
  enabled,
  locale,
  onChange,
}: {
  phase: ProjectPhase | null | undefined;
  enabled: boolean;
  locale: Locale;
  onChange: (phase: ProjectPhase | null) => void;
}) {
  const s = UI_STRINGS.coverPage;
  return (
    <select
      value={phase === null ? "na" : (phase ?? 1)}
      onChange={(e) => onChange(e.target.value === "na" ? null : (Number(e.target.value) as ProjectPhase))}
      title={t(s.phaseTitle, locale)}
      className={`w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-xs focus:border-brand-indigo focus:outline-none ${enabled ? "text-brand-ink" : "text-slate-400"}`}
    >
      {PHASES.map((p) => (
        <option key={p} value={p}>
          {t(s.columnPhase, locale)} {p}
        </option>
      ))}
      <option value="na">{t(s.phaseNotApplicable, locale)}</option>
    </select>
  );
}

const STAGES: DealStage[] = ["proposal", "closed_won"];

/** Sales stage per onderdeel, so the forecast can tell won work from work still being proposed. */
function StageSelect({
  stage,
  enabled,
  locale,
  onChange,
}: {
  stage: DealStage | undefined;
  enabled: boolean;
  locale: Locale;
  onChange: (stage: DealStage) => void;
}) {
  const s = UI_STRINGS.coverPage;
  const value = stage ?? "proposal";
  const won = value === "closed_won";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DealStage)}
      title={t(s.stageTitle, locale)}
      className={`w-full rounded border px-1.5 py-1 text-xs focus:border-brand-indigo focus:outline-none ${
        won ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-800" : "border-slate-300 bg-white"
      } ${enabled ? "" : "opacity-50"}`}
    >
      {STAGES.map((option) => (
        <option key={option} value={option}>
          {t(option === "closed_won" ? s.stageClosedWon : s.stageProposal, locale)}
        </option>
      ))}
    </select>
  );
}

/** Blank while a row is unchecked, so an all-zero result doesn't clutter the list. */
function HoursCell({ enabled, hours, locale }: { enabled: boolean; hours: number; locale: Locale }) {
  return (
    <span className="text-right text-xs font-medium tabular-nums text-brand-ink">
      {enabled ? formatHours(hours, locale) : ""}
    </span>
  );
}

function BudgetCell({ enabled, price, locale }: { enabled: boolean; price: number; locale: Locale }) {
  return (
    <span className="text-right text-xs font-medium tabular-nums text-brand-ink">
      {enabled ? formatCurrency(price, locale) : ""}
    </span>
  );
}

function WorkstreamRow({
  workstream,
  hours,
  price,
  locale,
  onChange,
  actions,
}: {
  workstream: StandardWorkstream;
  hours: number;
  price: number;
  locale: Locale;
  onChange: (next: StandardWorkstream) => void;
  /** Extra controls after the name (the edit button on user-created workstreams). */
  actions?: React.ReactNode;
}) {
  const s = UI_STRINGS.coverPage;
  return (
    <div className={`${ROW_GRID} rounded-md px-3 py-2.5 hover:bg-slate-50`}>
      <div className="flex min-w-0 items-center gap-2">
        <label className="flex min-w-0 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={workstream.enabled}
            onChange={(e) => onChange({ ...workstream, enabled: e.target.checked })}
            className="h-4 w-4 flex-shrink-0 rounded border-slate-300 accent-brand-indigo"
          />
          <span
            title={t(workstream.label, locale)}
            className={`truncate text-sm font-medium ${workstream.enabled ? "text-brand-ink" : "text-slate-400"}`}
          >
            {t(workstream.label, locale)}
          </span>
        </label>
        {workstream.custom && (
          <span className="flex-shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
            {t(CUSTOM_WORKSTREAM_TYPE_LABELS[workstream.custom.type], locale)}
            {workstream.custom.retainerMonths
              ? ` · ${t(s.retainerBadge, locale)} ${workstream.custom.retainerMonths} ${t(s.monthsShort, locale)}`
              : ""}
          </span>
        )}
        {actions}
      </div>
      <PhaseSelect
        phase={workstream.phase}
        enabled={workstream.enabled}
        locale={locale}
        onChange={(phase) => onChange({ ...workstream, phase })}
      />
      <StageSelect
        stage={workstream.stage}
        enabled={workstream.enabled}
        locale={locale}
        onChange={(stage) => onChange({ ...workstream, stage })}
      />
      <span className="flex items-center justify-end gap-2 text-xs">
        <span className="font-medium text-slate-600">&euro;{workstream.hourlyRate}/h</span>
        <RateHint
          rate={workstream.hourlyRate}
          defaultRate={DEFAULT_HOURLY_RATES[workstream.key] ?? workstream.hourlyRate}
          locale={locale}
        />
      </span>
      <HoursCell enabled={workstream.enabled} hours={hours} locale={locale} />
      <BudgetCell enabled={workstream.enabled} price={price} locale={locale} />
    </div>
  );
}

function ToggleRow({
  label,
  rate,
  defaultRate,
  enabled,
  phase,
  stage,
  hours,
  price,
  locale,
  onChange,
  onChangePhase,
  onChangeStage,
}: {
  label: LocalizedString;
  rate: number;
  defaultRate: number;
  enabled: boolean;
  phase: ProjectPhase | null | undefined;
  stage: DealStage | undefined;
  hours: number;
  price: number;
  locale: Locale;
  onChange: (enabled: boolean) => void;
  onChangePhase: (phase: ProjectPhase | null) => void;
  onChangeStage: (stage: DealStage) => void;
}) {
  return (
    <div className={`${ROW_GRID} rounded-md px-3 py-2.5 hover:bg-slate-50`}>
      <label className="flex min-w-0 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 flex-shrink-0 rounded border-slate-300 accent-brand-indigo"
        />
        <span className={`truncate text-sm font-medium ${enabled ? "text-brand-ink" : "text-slate-400"}`}>
          {t(label, locale)}
        </span>
      </label>
      <PhaseSelect phase={phase} enabled={enabled} locale={locale} onChange={onChangePhase} />
      <StageSelect stage={stage} enabled={enabled} locale={locale} onChange={onChangeStage} />
      <span className="flex items-center justify-end gap-2 text-xs">
        <span className="font-medium text-slate-600">&euro;{rate}/h</span>
        <RateHint rate={rate} defaultRate={defaultRate} locale={locale} />
      </span>
      <HoursCell enabled={enabled} hours={hours} locale={locale} />
      <BudgetCell enabled={enabled} price={price} locale={locale} />
    </div>
  );
}

/**
 * A checkbox-only row for toggles that have no rate/hours/budget of their
 * own (the HubSpot license subscription isn't priced in hours x rate, so
 * ROW_GRID's Rate/Hours/Budget columns don't apply to it).
 */
function SimpleToggleRow({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 flex-shrink-0 rounded border-slate-300 accent-brand-indigo"
      />
      <span className={`truncate text-sm font-medium ${enabled ? "text-brand-ink" : "text-slate-400"}`}>{label}</span>
    </label>
  );
}

function GroupCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-brand-indigo">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/**
 * One place to set this estimation's two rates: PM (direct) and the bulk
 * "service rate" for everything else (direct too, but it also reprices
 * every onderdeel still following it - see applyServiceRate).
 */
function RatesCard({
  pmRate,
  pmPercent,
  serviceRate,
  locale,
  onChangePmRate,
  onChangePmPercent,
  onChangeServiceRate,
}: {
  pmRate: number;
  /** Stored as a fraction (0.15); edited here as a percentage (15). */
  pmPercent: number;
  serviceRate: number;
  locale: Locale;
  onChangePmRate: (rate: number) => void;
  onChangePmPercent: (fraction: number) => void;
  onChangeServiceRate: (rate: number) => void;
}) {
  const s = UI_STRINGS.coverPage;
  const field =
    "w-20 rounded border border-slate-300 bg-white px-2 py-1.5 text-right tabular-nums focus:border-brand-indigo focus:outline-none";
  return (
    <GroupCard title={t(s.ratesTitle, locale)} description={t(s.ratesDescription, locale)}>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{t(s.pmRateInputLabel, locale)}</span>
          <span className="flex items-center gap-1">
            &euro;
            <input
              type="number"
              min={0}
              value={pmRate}
              onChange={(e) => onChangePmRate(Number(e.target.value))}
              className={field}
            />
            /h
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{t(s.pmPercentInputLabel, locale)}</span>
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={Math.round(pmPercent * 1000) / 10}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 0 && value <= 100) onChangePmPercent(value / 100);
              }}
              className={field}
            />
            %
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">{t(s.serviceRateInputLabel, locale)}</span>
          <span className="flex items-center gap-1">
            &euro;
            <input
              type="number"
              min={0}
              value={serviceRate}
              onChange={(e) => onChangeServiceRate(Number(e.target.value))}
              className={field}
            />
            /h
          </span>
        </label>
      </div>
    </GroupCard>
  );
}

interface CoverPageProps {
  data: EstimationState;
  onChangeWorkstream: (key: string, next: StandardWorkstream) => void;
  onChangeThirdParty: (next: ThirdPartyIntegrationState) => void;
  onChangeElixirSync: (next: ElixirSyncIntegrationState) => void;
  onChangeHubSpotLicense: (next: HubSpotLicenseState) => void;
  onAddWorkstream: (ws: StandardWorkstream) => void;
  onRemoveWorkstream: (key: string) => void;
  onChangePm: (next: Partial<Pick<EstimationState, "pmRate" | "pmPercent">>) => void;
  onApplyServiceRate: (rate: number) => void;
  locale: Locale;
}

/**
 * A user-created workstream on the Cover page: its row, plus an edit form (name,
 * type, billing, retainer months, remove) behind the pencil button - so the
 * workstream can be defined and changed here without opening its tab.
 */
function CustomWorkstreamRow({
  workstream,
  hours,
  price,
  locale,
  onChange,
  onRemove,
  startEditing = false,
}: {
  workstream: StandardWorkstream;
  hours: number;
  price: number;
  locale: Locale;
  onChange: (next: StandardWorkstream) => void;
  onRemove: () => void;
  /** Opens the edit form straight away (a workstream that was just added). */
  startEditing?: boolean;
}) {
  const s = UI_STRINGS.coverPage;
  const w = UI_STRINGS.workstreamPanel;
  const [editing, setEditing] = useState(startEditing);
  const custom = workstream.custom!;
  const setCustom = (patch: Partial<typeof custom>) => onChange({ ...workstream, custom: { ...custom, ...patch } });
  const field = "rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-brand-indigo focus:outline-none";
  return (
    <div>
      <WorkstreamRow
        workstream={workstream}
        hours={hours}
        price={price}
        locale={locale}
        onChange={onChange}
        actions={
          <button
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
            title={t(s.editWorkstream, locale)}
            className={`flex-shrink-0 rounded p-1 ${editing ? "bg-brand-indigo text-white" : "text-slate-400 hover:bg-brand-indigo/5 hover:text-brand-indigo"}`}
          >
            <Pencil {...iconProps} size={14} />
          </button>
        }
      />
      {editing && (
        <div className="mx-3 mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-violet-200 bg-violet-50/60 px-3 py-2.5 text-sm text-slate-600">
          <label className="flex min-w-[260px] flex-1 items-center gap-2 whitespace-nowrap">
            {t(w.workstreamName, locale)}
            <input
              value={workstream.label[locale]}
              onChange={(e) => onChange({ ...workstream, label: { en: e.target.value, nl: e.target.value } })}
              className={`${field} min-w-0 flex-1`}
            />
          </label>
          <label className="flex items-center gap-2 whitespace-nowrap">
            {t(w.workstreamType, locale)}
            <select value={custom.type} onChange={(e) => setCustom({ type: e.target.value as CustomWorkstreamType })} className={field}>
              {CUSTOM_WORKSTREAM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(CUSTOM_WORKSTREAM_TYPE_LABELS[type], locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 whitespace-nowrap">
            {t(w.billing, locale)}
            <select
              value={custom.retainerMonths ? "retainer" : "one_off"}
              onChange={(e) => setCustom({ retainerMonths: e.target.value === "retainer" ? DEFAULT_RETAINER_MONTHS : null })}
              className={field}
            >
              <option value="one_off">{t(w.billingOneOff, locale)}</option>
              <option value="retainer">{t(w.billingRetainer, locale)}</option>
            </select>
          </label>
          {custom.retainerMonths && (
            <label className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={120}
                value={custom.retainerMonths}
                onChange={(e) => {
                  const value = Math.round(Number(e.target.value));
                  if (value >= 1 && value <= 120) setCustom({ retainerMonths: value });
                }}
                className={`${field} w-16 text-right tabular-nums`}
              />
              {t(w.months, locale)}
            </label>
          )}
          <button onClick={onRemove} className="ml-auto text-sm font-medium text-brand-crimson hover:underline">
            {t(s.removeWorkstream, locale)}
          </button>
        </div>
      )}
    </div>
  );
}

/** Name + type, then "Add": the new workstream gets its own tab, where its lines and billing are set. */
function AddCustomWorkstream({ locale, onAdd }: { locale: Locale; onAdd: (ws: StandardWorkstream) => void }) {
  const s = UI_STRINGS.coverPage;
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomWorkstreamType>("change_requests");
  function add() {
    onAdd(createCustomWorkstream(name, type));
    setName("");
  }
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder={t(s.customNamePlaceholder, locale)}
        className="min-w-[220px] flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-indigo focus:outline-none"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as CustomWorkstreamType)}
        className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-indigo focus:outline-none"
      >
        {CUSTOM_WORKSTREAM_TYPES.map((option) => (
          <option key={option} value={option}>
            {t(CUSTOM_WORKSTREAM_TYPE_LABELS[option], locale)}
          </option>
        ))}
      </select>
      <button
        onClick={add}
        className="btn btn-primary"
      >
        <Plus {...iconProps} />
          {t(s.addCustomWorkstream, locale)}
      </button>
    </div>
  );
}

export function CoverPage({
  data,
  onChangeWorkstream,
  onAddWorkstream,
  onRemoveWorkstream,
  onChangeThirdParty,
  onChangeElixirSync,
  onChangeHubSpotLicense,
  onChangePm,
  onApplyServiceRate,
  locale,
}: CoverPageProps) {
  const s = UI_STRINGS.coverPage;
  const byKey = (key: string) => data.standardWorkstreams.find((ws) => ws.key === key);
  const foundation = FOUNDATION_KEYS.map(byKey).filter((ws): ws is StandardWorkstream => !!ws);
  const hubs = HUB_KEYS.map(byKey).filter((ws): ws is StandardWorkstream => !!ws);
  const customs = data.standardWorkstreams.filter(isCustomWorkstream);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const totals = computeEstimationTotals(data);
  const resultFor = (key: string) => totals.workstreams.find((w) => w.key === key);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-brand-indigo">{t(s.heading, locale)}</h2>
        <p className="mt-1 text-sm text-slate-500">{t(s.intro, locale)}</p>
      </div>

      <Rulebook locale={locale} />

      <RatesCard
        pmRate={data.pmRate}
        pmPercent={data.pmPercent}
        serviceRate={data.serviceRate}
        locale={locale}
        onChangePmRate={(pmRate) => onChangePm({ pmRate })}
        onChangePmPercent={(pmPercent) => onChangePm({ pmPercent })}
        onChangeServiceRate={onApplyServiceRate}
      />

      <GroupCard title={t(s.foundationTitle, locale)} description={t(s.foundationDescription, locale)}>
        <ColumnHeader locale={locale} />
        <div className="divide-y divide-slate-100 p-1.5 pt-0">
          {foundation.map((ws) => (
            <WorkstreamRow
              key={ws.key}
              workstream={ws}
              hours={resultFor(ws.key)?.hours ?? 0}
              price={resultFor(ws.key)?.price ?? 0}
              locale={locale}
              onChange={(next) => onChangeWorkstream(ws.key, next)}
            />
          ))}
        </div>
      </GroupCard>

      <GroupCard title={t(s.hubsTitle, locale)} description={t(s.hubsDescription, locale)}>
        <ColumnHeader locale={locale} />
        <div className="divide-y divide-slate-100 p-1.5 pt-0">
          {hubs.map((ws) => (
            <WorkstreamRow
              key={ws.key}
              workstream={ws}
              hours={resultFor(ws.key)?.hours ?? 0}
              price={resultFor(ws.key)?.price ?? 0}
              locale={locale}
              onChange={(next) => onChangeWorkstream(ws.key, next)}
            />
          ))}
        </div>
      </GroupCard>

      <GroupCard title={t(s.customTitle, locale)} description={t(s.customDescription, locale)}>
        {customs.length > 0 && (
          <>
            <ColumnHeader locale={locale} />
            <div className="divide-y divide-slate-100 p-1.5 pt-0">
              {customs.map((ws) => (
                <CustomWorkstreamRow
                  key={ws.key}
                  workstream={ws}
                  hours={resultFor(ws.key)?.hours ?? 0}
                  price={resultFor(ws.key)?.price ?? 0}
                  locale={locale}
                  onChange={(next) => onChangeWorkstream(ws.key, next)}
                  startEditing={ws.key === justAdded}
                  onRemove={() => {
                    if (window.confirm(`${t(s.removeWorkstreamConfirm, locale)} "${t(ws.label, locale)}"?`)) onRemoveWorkstream(ws.key);
                  }}
                />
              ))}
            </div>
          </>
        )}
        <AddCustomWorkstream
          locale={locale}
          onAdd={(ws) => {
            setJustAdded(ws.key);
            onAddWorkstream(ws);
          }}
        />
      </GroupCard>

      <GroupCard title={t(s.integrationsTitle, locale)} description={t(s.integrationsDescription, locale)}>
        <ColumnHeader locale={locale} />
        <div className="divide-y divide-slate-100 p-1.5 pt-0">
          <ToggleRow
            label={UI_STRINGS.editor.tabElixirSync}
            rate={data.elixirSyncIntegration.hourlyRate}
            defaultRate={DEFAULT_HOURLY_RATES.elixirsync_integration}
            enabled={data.elixirSyncIntegration.enabled}
            hours={totals.elixirSync.hours}
            price={totals.elixirSync.price}
            locale={locale}
            phase={data.elixirSyncIntegration.phase}
            onChange={(enabled) => onChangeElixirSync({ ...data.elixirSyncIntegration, enabled })}
            onChangePhase={(phase) => onChangeElixirSync({ ...data.elixirSyncIntegration, phase })}
            stage={data.elixirSyncIntegration.stage}
            onChangeStage={(stage) => onChangeElixirSync({ ...data.elixirSyncIntegration, stage })}
          />
          <ToggleRow
            label={UI_STRINGS.editor.tabThirdParty}
            rate={data.thirdPartyIntegration.hourlyRate}
            defaultRate={DEFAULT_HOURLY_RATES.third_party_integration}
            enabled={data.thirdPartyIntegration.enabled}
            hours={totals.thirdParty.hours}
            price={totals.thirdParty.price}
            locale={locale}
            phase={data.thirdPartyIntegration.phase}
            onChange={(enabled) => onChangeThirdParty({ ...data.thirdPartyIntegration, enabled })}
            onChangePhase={(phase) => onChangeThirdParty({ ...data.thirdPartyIntegration, phase })}
            stage={data.thirdPartyIntegration.stage}
            onChangeStage={(stage) => onChangeThirdParty({ ...data.thirdPartyIntegration, stage })}
          />
        </div>
      </GroupCard>

      {FEATURES.hubspotLicense && (
        <GroupCard title={t(s.hubspotLicenseTitle, locale)} description={t(s.hubspotLicenseDescription, locale)}>
          <div className="p-1.5">
            <SimpleToggleRow
              label={t(UI_STRINGS.editor.tabHubspotLicense, locale)}
              enabled={data.hubspotLicense.enabled}
              onChange={(enabled) => onChangeHubSpotLicense({ ...data.hubspotLicense, enabled })}
            />
          </div>
        </GroupCard>
      )}

      <div className={`${ROW_GRID} rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm`}>
        <span className="text-slate-500">{t(s.pmRateLabel, locale)}</span>
        <span />
        <span />
        <span className="flex items-center justify-end gap-2 text-xs">
          <span className="font-medium text-brand-ink">{formatCurrency(data.pmRate, locale)}/h</span>
          <RateHint rate={data.pmRate} defaultRate={DEFAULT_HOURLY_RATES.pm} locale={locale} />
        </span>
        <HoursCell enabled hours={totals.pmHours} locale={locale} />
        <BudgetCell enabled price={totals.pmPrice} locale={locale} />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-brand-indigo px-4 py-3 text-white shadow-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">{t(s.projectTotal, locale)}</div>
          <div className="text-xs text-white/70">
            {formatHours(totals.totalEffortHours, locale)} {t(s.totalEffort, locale)}
          </div>
        </div>
        <div className="text-lg font-semibold tabular-nums">{formatCurrency(totals.grandTotalPrice, locale)}</div>
      </div>
    </div>
  );
}
